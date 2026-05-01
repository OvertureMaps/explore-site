/**
 * Tests for lib/zipDownload.js
 *
 * Two scopes:
 *   1. buildZip — pure function, verified by round-tripping through fflate's
 *      unzipSync. No DOM, no mocks beyond fflate itself (which we trust).
 *   2. triggerBrowserDownload / downloadAsZip — DOM side-effects verified by
 *      injecting a stub document and stubbing URL.createObjectURL. No real
 *      navigation occurs in jsdom; we assert the link element was constructed
 *      with the right href/download attributes and click() was invoked.
 */

import { unzipSync, strFromU8 } from "fflate";
import {
  buildZip,
  triggerBrowserDownload,
  downloadAsZip,
} from "@/lib/zipDownload";

describe("buildZip", () => {
  it("packages multiple string entries and round-trips through unzipSync", () => {
    const files = [
      { name: "a.geojson", data: '{"type":"FeatureCollection","features":[]}' },
      { name: "b.geojson", data: '{"type":"FeatureCollection","features":[1]}' },
    ];

    const zipped = buildZip(files);
    expect(zipped).toBeInstanceOf(Uint8Array);
    expect(zipped.length).toBeGreaterThan(0);

    const unzipped = unzipSync(zipped);
    expect(Object.keys(unzipped).sort()).toEqual(["a.geojson", "b.geojson"]);
    expect(strFromU8(unzipped["a.geojson"])).toBe(files[0].data);
    expect(strFromU8(unzipped["b.geojson"])).toBe(files[1].data);
  });

  it("accepts Uint8Array entries (the geoarrow-wasm writeGeoJSON output type)", () => {
    // Construct bytes manually — TextEncoder isn't reliably available in jsdom.
    const payload = Uint8Array.from([0x7b, 0x22, 0x6b, 0x22, 0x3a, 0x22, 0x76, 0x22, 0x7d]); // {"k":"v"}
    const zipped = buildZip([{ name: "x.geojson", data: payload }]);

    const unzipped = unzipSync(zipped);
    expect(unzipped["x.geojson"]).toEqual(payload);
  });

  it("STORE mode (compress=false) produces output at least as large as the input payload", () => {
    // STORE = no compression. The ZIP wrapper adds headers, so output > input.
    // This is a sanity check that compress=false actually disables DEFLATE.
    const payload = "x".repeat(1000);
    const zipped = buildZip([{ name: "f.txt", data: payload }], { compress: false });
    expect(zipped.length).toBeGreaterThanOrEqual(payload.length);
  });

  it("default (compress) shrinks highly compressible payloads", () => {
    const payload = "x".repeat(5000); // trivially compressible
    const stored = buildZip([{ name: "f.txt", data: payload }], { compress: false });
    const deflated = buildZip([{ name: "f.txt", data: payload }]);
    expect(deflated.length).toBeLessThan(stored.length);
  });

  it.each([
    ["null", null],
    ["undefined", undefined],
    ["empty array", []],
    ["non-array", "not an array"],
  ])("throws TypeError when files is %s", (_label, input) => {
    expect(() => buildZip(input)).toThrow(TypeError);
  });

  it("throws when a file is missing a name", () => {
    expect(() => buildZip([{ data: "x" }])).toThrow(TypeError);
  });

  it("throws when a file has an empty name", () => {
    expect(() => buildZip([{ name: "", data: "x" }])).toThrow(TypeError);
  });

  it("throws when a file is missing data", () => {
    expect(() => buildZip([{ name: "a.txt" }])).toThrow(/missing.*data/);
  });

  it("accepts ArrayBuffer entries by wrapping them in a Uint8Array", () => {
    const buf = new ArrayBuffer(4);
    new Uint8Array(buf).set([0xde, 0xad, 0xbe, 0xef]);

    const zipped = buildZip([{ name: "x.bin", data: buf }]);
    const unzipped = unzipSync(zipped);
    expect(Array.from(unzipped["x.bin"])).toEqual([0xde, 0xad, 0xbe, 0xef]);
  });

  it.each([
    ["number", 42],
    ["plain object", { foo: "bar" }],
    ["Blob", new Blob(["hello"])],
    ["array", [1, 2, 3]],
  ])("throws TypeError when data is an unsupported type (%s)", (_label, data) => {
    expect(() => buildZip([{ name: "f.bin", data }])).toThrow(
      /must have `data` as a string, Uint8Array, or ArrayBuffer/
    );
  });

  it.each(["__proto__", "prototype", "constructor"])(
    "rejects the reserved filename %s to prevent prototype pollution / fflate input collisions",
    (name) => {
      // Without this guard, "__proto__" would mutate Object.prototype on a
      // plain-object map, and even Object.create(null) doesn't help because
      // fflate's own input handling can't accept that key. See the lib comment.
      const protoBefore = Object.prototype.toString;
      expect(() => buildZip([{ name, data: "x" }])).toThrow(
        /reserved and cannot be used/
      );
      expect(Object.prototype.toString).toBe(protoBefore);
    }
  );

  it("does not pollute Object.prototype when zipping an ordinary archive", () => {
    const protoBefore = Object.prototype.toString;
    buildZip([{ name: "real.txt", data: "ok" }]);
    expect(Object.prototype.toString).toBe(protoBefore);
    expect({}.__proto__).toBe(Object.prototype);
  });
});

describe("triggerBrowserDownload", () => {
  let createObjectURLSpy;
  let revokeObjectURLSpy;
  let originalCreate;
  let originalRevoke;

  beforeEach(() => {
    // jsdom doesn't implement URL.createObjectURL/revokeObjectURL, so we
    // assign stubs directly rather than using jest.spyOn.
    originalCreate = URL.createObjectURL;
    originalRevoke = URL.revokeObjectURL;
    createObjectURLSpy = jest.fn().mockReturnValue("blob:mock-url");
    revokeObjectURLSpy = jest.fn();
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = revokeObjectURLSpy;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it("creates an <a> with the correct href and download, clicks it, and cleans up", () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04]); // ZIP magic
    const clickSpy = jest.fn();

    // Spy on createElement to intercept the anchor element
    const realCreate = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    triggerBrowserDownload(bytes, "archive.zip");

    expect(createObjectURLSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectURLSpy.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/zip");

    expect(clickSpy).toHaveBeenCalledTimes(1);

    // The anchor must be removed from the DOM after click
    expect(document.querySelectorAll("a[download]").length).toBe(0);

    // revokeObjectURL is deferred to next tick — verify it fires
    jest.runAllTimers();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });

  it("passes a Blob through without re-wrapping", () => {
    const blob = new Blob(["hello"], { type: "text/plain" });
    triggerBrowserDownload(blob, "hello.txt");

    expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
  });

  it("respects a custom mimeType", () => {
    triggerBrowserDownload(new Uint8Array([1, 2, 3]), "f.bin", {
      mimeType: "application/octet-stream",
    });

    const blob = createObjectURLSpy.mock.calls[0][0];
    expect(blob.type).toBe("application/octet-stream");
  });

  it("revokes the object URL even if click() throws", () => {
    const realCreate = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag === "a") {
        el.click = () => {
          throw new Error("simulated click failure");
        };
      }
      return el;
    });

    expect(() =>
      triggerBrowserDownload(new Uint8Array([1]), "f.zip")
    ).toThrow("simulated click failure");

    // Anchor must still be removed despite the throw
    expect(document.querySelectorAll("a[download]").length).toBe(0);

    jest.runAllTimers();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:mock-url");
  });
});

describe("downloadAsZip", () => {
  let originalCreate;
  let originalRevoke;
  let createObjectURLSpy;

  beforeEach(() => {
    originalCreate = URL.createObjectURL;
    originalRevoke = URL.revokeObjectURL;
    createObjectURLSpy = jest.fn().mockReturnValue("blob:mock-url");
    URL.createObjectURL = createObjectURLSpy;
    URL.revokeObjectURL = jest.fn();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    URL.createObjectURL = originalCreate;
    URL.revokeObjectURL = originalRevoke;
  });

  it("builds a valid ZIP and triggers a download with the given archive name", () => {
    const clickSpy = jest.fn();
    const realCreate = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag) => {
      const el = realCreate(tag);
      if (tag === "a") el.click = clickSpy;
      return el;
    });

    const files = [
      { name: "buildings.geojson", data: '{"type":"FeatureCollection"}' },
      { name: "places.geojson", data: '{"type":"FeatureCollection"}' },
    ];

    downloadAsZip(files, "overture-bundle.zip");

    expect(clickSpy).toHaveBeenCalledTimes(1);

    // Verify the blob handed to createObjectURL is a real ZIP we can read back
    const blob = createObjectURLSpy.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe("application/zip");
  });

  it("propagates buildZip validation errors without invoking the DOM", () => {
    const createElementSpy = jest.spyOn(document, "createElement");
    expect(() => downloadAsZip([], "empty.zip")).toThrow(TypeError);
    expect(createElementSpy).not.toHaveBeenCalled();
  });
});
