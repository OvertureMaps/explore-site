/**
 * Utilities for estimating download sizes before the actual parquet fetch.
 *
 * We issue HTTP HEAD requests against the S3 parquet files and sum their
 * Content-Length headers. This is a best-effort estimate — if CORS or the
 * server omits Content-Length, we return null so the UI can degrade gracefully.
 */

/**
 * Formats a byte count as a human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "unknown size";
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

/**
 * Issues HEAD requests for all parquet files belonging to one layer type
 * and returns the summed Content-Length in bytes.
 *
 * Returns null if any individual request fails or omits Content-Length,
 * since a partial sum would be misleading.
 *
 * @param {string} basePath  S3 base URL (with trailing slash)
 * @param {string[]} files   Relative file paths within the bucket
 * @returns {Promise<number|null>}
 */
export async function fetchTypeSize(basePath, files) {
  if (!Array.isArray(files) || files.length === 0) return 0;

  const sizes = await Promise.all(
    files.map(async (file) => {
      try {
        const res = await fetch(`${basePath}${file}`, { method: "HEAD" });
        const cl = res.headers.get("content-length");
        return cl ? parseInt(cl, 10) : null;
      } catch {
        return null;
      }
    })
  );

  if (sizes.some((s) => s === null)) return null;
  return sizes.reduce((a, b) => a + b, 0);
}
