/**
 * Helpers for packaging multiple in-memory files into a single ZIP archive
 * and triggering a browser download.
 *
 * Why ZIP everything into one file?
 *   Mobile Safari (iOS) silently drops all but the first programmatic
 *   download per user gesture, and even desktop browsers prompt the user to
 *   "allow multiple downloads" when an `<a download>` is clicked more than
 *   once in quick succession. Returning a single archive sidesteps both.
 *
 * fflate is used in DEFLATE mode (level 6) by default. GeoJSON is highly
 * repetitive (`"type"`, `"properties"`, `"geometry"`, `"coordinates"` on every
 * feature) and typically compresses 5-10x. The CPU cost is negligible vs. the
 * parquet-to-GeoJSON WASM step that already gates the download. Pass
 * `compress: false` to fall back to STORE mode if a benchmark ever shows the
 * tradeoff has flipped.
 *
 * The helpers are split so the pure packaging logic (`buildZip`) is trivially
 * testable in jsdom without touching the DOM, while `triggerBrowserDownload`
 * isolates the side-effecting bits.
 */

import { zipSync, strToU8 } from "fflate";

/**
 * Build a ZIP archive from an array of {name, data} entries.
 *
 * @param {Array<{name: string, data: Uint8Array | string}>} files
 * @param {{compress?: boolean}} [options] - compress=false switches to STORE (no compression). Defaults to true (DEFLATE level 6).
 * @returns {Uint8Array} the raw ZIP bytes
 * @throws {TypeError} if files is not a non-empty array of valid entries
 */
export function buildZip(files, options = {}) {
  if (!Array.isArray(files) || files.length === 0) {
    throw new TypeError("buildZip requires a non-empty array of files");
  }

  const level = options.compress === false ? 0 : 6;
  const zipInput = {};

  for (const file of files) {
    if (!file || typeof file.name !== "string" || file.name.length === 0) {
      throw new TypeError("each file must have a non-empty string `name`");
    }
    if (file.data == null) {
      throw new TypeError(`file "${file.name}" is missing \`data\``);
    }

    const bytes =
      typeof file.data === "string" ? strToU8(file.data) : file.data;

    // fflate per-entry options: level 0 = STORE, 6 = DEFLATE default.
    zipInput[file.name] = [bytes, { level }];
  }

  return zipSync(zipInput);
}

/**
 * Trigger a browser download of the given bytes as a single file.
 * Safe to call from any user-gesture-initiated handler.
 *
 * @param {Uint8Array | Blob} data
 * @param {string} filename
 * @param {{mimeType?: string, doc?: Document}} [options]
 *   `doc` is injected for testability; defaults to global document.
 */
export function triggerBrowserDownload(data, filename, options = {}) {
  const { mimeType = "application/zip", doc = document } = options;

  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = doc.createElement("a");
  link.href = url;
  link.download = filename;

  doc.body.appendChild(link);
  try {
    link.click();
  } finally {
    doc.body.removeChild(link);
    // Revoke on the next tick so the browser has a chance to start the download
    // before the URL is invalidated.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

/**
 * Convenience: build a ZIP and immediately trigger its download.
 *
 * @param {Array<{name: string, data: Uint8Array | string}>} files
 * @param {string} archiveName
 * @param {{compress?: boolean, doc?: Document}} [options]
 */
export function downloadAsZip(files, archiveName, options = {}) {
  const bytes = buildZip(files, { compress: options.compress });
  triggerBrowserDownload(bytes, archiveName, { doc: options.doc });
}
