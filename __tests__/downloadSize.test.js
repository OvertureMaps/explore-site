/**
 * Tests for lib/downloadSize.js
 */

import { formatBytes, fetchTypeSize } from "@/lib/downloadSize";

describe("formatBytes", () => {
  it.each([
    [0, "0 B"],
    [512, "512 B"],
    [1023, "1023 B"],
    [1024, "1.0 KB"],
    [1536, "1.5 KB"],
    [1024 * 1024, "1.0 MB"],
    [1.5 * 1024 * 1024, "1.5 MB"],
    [1024 * 1024 * 1024, "1.0 GB"],
    [2.5 * 1024 * 1024 * 1024, "2.5 GB"],
  ])("formats %d bytes as %s", (input, expected) => {
    expect(formatBytes(input)).toBe(expected);
  });

  it.each([
    [-1],
    [NaN],
    [Infinity],
    [-Infinity],
  ])("returns 'unknown size' for invalid input %s", (input) => {
    expect(formatBytes(input)).toBe("unknown size");
  });
});

describe("fetchTypeSize", () => {
  let originalFetch;

  beforeEach(() => {
    originalFetch = global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  function mockFetch(responses) {
    let callIndex = 0;
    global.fetch = jest.fn().mockImplementation(() => {
      const idx = callIndex++;
      const r = idx < responses.length ? responses[idx] : responses[responses.length - 1];
      if (r instanceof Error) return Promise.reject(r);
      return Promise.resolve({
        headers: { get: (name) => (name === "content-length" ? r : null) },
      });
    });
  }

  it("returns 0 for an empty files array", async () => {
    expect(await fetchTypeSize("https://base/", [])).toBe(0);
  });

  it("returns null for a null/undefined files argument", async () => {
    expect(await fetchTypeSize("https://base/", null)).toBe(0);
  });

  it("sums content-length headers across multiple files", async () => {
    mockFetch(["1000", "2000", "500"]);
    const result = await fetchTypeSize("https://base/", ["a.parquet", "b.parquet", "c.parquet"]);
    expect(result).toBe(3500);
  });

  it("returns null when any file is missing a content-length header", async () => {
    mockFetch(["1000", null, "500"]);
    const result = await fetchTypeSize("https://base/", ["a.parquet", "b.parquet", "c.parquet"]);
    expect(result).toBeNull();
  });

  it("returns null when a fetch throws (e.g. network error)", async () => {
    mockFetch([new Error("network error"), "500"]);
    const result = await fetchTypeSize("https://base/", ["a.parquet", "b.parquet"]);
    expect(result).toBeNull();
  });

  it("constructs the correct URL by concatenating basePath and file", async () => {
    mockFetch(["100"]);
    await fetchTypeSize("https://bucket.s3.amazonaws.com/", ["release/type/file.parquet"]);
    expect(global.fetch).toHaveBeenCalledWith(
      "https://bucket.s3.amazonaws.com/release/type/file.parquet",
      { method: "HEAD" }
    );
  });

  it("handles a single file with a valid content-length", async () => {
    mockFetch(["4096"]);
    expect(await fetchTypeSize("https://base/", ["single.parquet"])).toBe(4096);
  });
});
