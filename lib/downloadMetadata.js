/**
 * Builds the metadata.json contents that ship inside every download ZIP.
 *
 * This file gives the user everything they need to:
 *   - Re-run the same query against parquet via overturemaps-py / DuckDB
 *     (the `bboxString` field is in the exact format both tools accept)
 *   - Reopen the same view in Explore (the `viewUrl` includes the map hash)
 *   - Trace the data back to a specific Overture release
 *
 * Kept as a pure function so it can be unit-tested without spinning up a
 * MapLibre instance. See issue #156.
 */

/**
 * @param {object} params
 * @param {[number, number, number, number]} params.bbox - [west, south, east, north]
 * @param {string} params.releaseVersion - Overture release id, e.g. "2024-09-18"
 * @param {string[]} params.layers - the layer type names included in this download
 * @param {string} [params.viewUrl] - full URL with map hash, e.g. window.location.href
 * @param {Date} [params.now] - injected for deterministic tests; defaults to new Date()
 * @returns {string} pretty-printed JSON suitable for a metadata.json file
 */
export function buildDownloadMetadata({
  bbox,
  releaseVersion,
  layers,
  viewUrl,
  now = new Date(),
}) {
  if (!Array.isArray(bbox) || bbox.length !== 4 || !bbox.every(Number.isFinite)) {
    throw new TypeError(
      "bbox must be an array of 4 finite numbers [west, south, east, north]"
    );
  }
  if (typeof releaseVersion !== "string" || releaseVersion.length === 0) {
    throw new TypeError("releaseVersion must be a non-empty string");
  }
  if (!Array.isArray(layers)) {
    throw new TypeError("layers must be an array");
  }

  const [west, south, east, north] = bbox;

  const metadata = {
    source: "https://explore.overturemaps.org/",
    // overturemaps-py and DuckDB ST_MakeEnvelope both accept this exact format
    bboxString: `${west},${south},${east},${north}`,
    bbox: { west, south, east, north },
    release: releaseVersion,
    layers: [...layers].sort(),
    generatedAt: now.toISOString(),
  };

  // viewUrl is optional — server-side rendering or tests may not have a window
  if (typeof viewUrl === "string" && viewUrl.length > 0) {
    metadata.viewUrl = viewUrl;
  }

  return JSON.stringify(metadata, null, 2);
}
