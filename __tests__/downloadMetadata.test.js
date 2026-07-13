/**
 * Tests for lib/downloadMetadata.js
 *
 * Pure-function tests — no DOM, no mocks. `now` is injected so the
 * `generatedAt` field is deterministic.
 */

import { buildDownloadMetadata } from "@/lib/downloadMetadata";

const FIXED_NOW = new Date("2026-01-15T12:34:56.000Z");

const baseInput = {
  bbox: [-77.6904949, 39.1365536, -77.68, 39.15],
  releaseVersion: "2024-09-18",
  layers: ["buildings", "places"],
  viewUrl: "https://explore.overturemaps.org/#15.42/39.13/-77.69",
  now: FIXED_NOW,
};

describe("buildDownloadMetadata", () => {
  it("produces parseable JSON with all expected fields", () => {
    const json = buildDownloadMetadata(baseInput);
    const parsed = JSON.parse(json);

    expect(parsed).toEqual({
      source: "https://explore.overturemaps.org/",
      bboxString: "-77.6904949,39.1365536,-77.68,39.15",
      bbox: { west: -77.6904949, south: 39.1365536, east: -77.68, north: 39.15 },
      release: "2024-09-18",
      layers: ["buildings", "places"],
      generatedAt: "2026-01-15T12:34:56.000Z",
      viewUrl: "https://explore.overturemaps.org/#15.42/39.13/-77.69",
    });
  });

  it("emits a bboxString in the exact format overturemaps-py / DuckDB accept", () => {
    // Format is `west,south,east,north` with no spaces — this is the contract.
    // Don't break it without updating downstream tooling docs.
    const json = buildDownloadMetadata(baseInput);
    expect(JSON.parse(json).bboxString).toBe(
      "-77.6904949,39.1365536,-77.68,39.15"
    );
  });

  it("preserves full coordinate precision (does not round)", () => {
    // The filenames use 3-decimal precision for brevity, but metadata must
    // round-trip the exact bbox the user queried with.
    const json = buildDownloadMetadata({
      ...baseInput,
      bbox: [-77.69049491234567, 39.13655361234567, -77.68, 39.15],
    });
    const parsed = JSON.parse(json);
    expect(parsed.bbox.west).toBe(-77.69049491234567);
    expect(parsed.bbox.south).toBe(39.13655361234567);
  });

  it("omits viewUrl when not provided (e.g. SSR / tests)", () => {
    const json = buildDownloadMetadata({ ...baseInput, viewUrl: undefined });
    const parsed = JSON.parse(json);
    expect(parsed).not.toHaveProperty("viewUrl");
  });

  it("omits viewUrl when empty string", () => {
    const json = buildDownloadMetadata({ ...baseInput, viewUrl: "" });
    expect(JSON.parse(json)).not.toHaveProperty("viewUrl");
  });

  it("sorts layers alphabetically for stable output across runs", () => {
    const json = buildDownloadMetadata({
      ...baseInput,
      layers: ["transportation", "buildings", "places"],
    });
    expect(JSON.parse(json).layers).toEqual([
      "buildings",
      "places",
      "transportation",
    ]);
  });

  it("does not mutate the caller's layers array", () => {
    const layers = ["zzz", "aaa"];
    buildDownloadMetadata({ ...baseInput, layers });
    expect(layers).toEqual(["zzz", "aaa"]);
  });

  it("accepts an empty layers array (download with no non-empty types is rejected upstream, but the helper itself is permissive)", () => {
    const json = buildDownloadMetadata({ ...baseInput, layers: [] });
    expect(JSON.parse(json).layers).toEqual([]);
  });

  it("uses the current time when `now` is omitted", () => {
    const before = Date.now();
    const json = buildDownloadMetadata({ ...baseInput, now: undefined });
    const after = Date.now();
    const ts = Date.parse(JSON.parse(json).generatedAt);
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it("produces pretty-printed JSON (2-space indent) for human readability", () => {
    const json = buildDownloadMetadata(baseInput);
    expect(json).toMatch(/\n {2}"source":/);
  });

  describe("input validation", () => {
    it.each([
      ["null", null],
      ["undefined", undefined],
      ["non-array", "not an array"],
      ["wrong length (3)", [1, 2, 3]],
      ["wrong length (5)", [1, 2, 3, 4, 5]],
      ["contains NaN", [NaN, 0, 1, 2]],
      ["contains Infinity", [0, 0, Infinity, 2]],
      ["contains string", [0, 0, "1", 2]],
    ])("rejects bbox that is %s", (_label, bbox) => {
      expect(() => buildDownloadMetadata({ ...baseInput, bbox })).toThrow(
        TypeError
      );
    });

    it.each([
      ["null", null],
      ["undefined", undefined],
      ["empty string", ""],
      ["number", 42],
    ])("rejects releaseVersion that is %s", (_label, releaseVersion) => {
      expect(() =>
        buildDownloadMetadata({ ...baseInput, releaseVersion })
      ).toThrow(TypeError);
    });

    it.each([
      ["null", null],
      ["undefined", undefined],
      ["string", "buildings"],
      ["object", { 0: "buildings" }],
    ])("rejects layers that is %s", (_label, layers) => {
      expect(() => buildDownloadMetadata({ ...baseInput, layers })).toThrow(
        TypeError
      );
    });
  });
});
