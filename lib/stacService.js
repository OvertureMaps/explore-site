import create from "stac-js";

const STAC_CATALOG_URL = "https://stac.overturemaps.org/catalog.json";
const CACHE_KEY = "overture-stac-cache";

// In-memory cache for the current session
let cachedStacData = null;
let stacDataPromise = null;

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(releaseUrl, releaseId, pmtilesUrls) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      releaseUrl,
      releaseId,
      pmtilesUrls: Object.fromEntries(pmtilesUrls),
    }));
  } catch {
    // localStorage unavailable — private browsing, quota exceeded, etc.
  }
}

/**
 * Resolves a relative URL against a base URL
 */
function resolveUrl(baseUrl, relativeUrl) {
  return new URL(relativeUrl, baseUrl).href;
}

/**
 * Fetches and parses a STAC catalog/collection from a URL
 */
async function fetchStacObject(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch STAC object from ${url}: ${response.statusText}`);
  }
  const data = await response.json();
  return { stacObject: create(data), url };
}


/**
 * Gets all theme catalogs from a release catalog
 */
async function getThemeCatalogs(releaseCatalog, releaseUrl) {
  const childLinks = releaseCatalog.getChildLinks();

  const themeCatalogs = await Promise.all(
    childLinks.map(async (link) => {
      const themeUrl = resolveUrl(releaseUrl, link.href);
      const { stacObject } = await fetchStacObject(themeUrl);
      return { catalog: stacObject, url: themeUrl, title: link.title || stacObject.id };
    })
  );

  return themeCatalogs;
}

/**
 * Extracts PMTiles URL from a theme catalog
 * Looks for a link with rel="pmtiles"
 */
function getPmtilesUrl(themeCatalog, themeUrl) {
  const links = themeCatalog.links || [];
  const pmtilesLink = links.find((link) => link.rel === "pmtiles");

  if (!pmtilesLink) {
    return null;
  }

  return resolveUrl(themeUrl, pmtilesLink.href);
}

/**
 * Loads and caches all STAC data from the catalog.
 *
 * Fast path (repeat visits): fetches only catalog.json, validates the latest
 * release URL against localStorage, and returns cached PMTiles URLs — skipping
 * the release catalog and all 6 theme catalog requests.
 *
 * Slow path (first visit or new release): fetches the full waterfall and
 * writes the result to localStorage for next time.
 */
async function loadStacData() {
  if (cachedStacData) return cachedStacData;

  if (!stacDataPromise) {
    stacDataPromise = (async () => {
      // Step 1 — fetch root catalog. If <link rel="preload"> is present in the
      // HTML head this response is already in the browser HTTP cache.
      const { stacObject: rootCatalog, url: rootUrl } = await fetchStacObject(STAC_CATALOG_URL);

      // Step 2 — resolve the latest release URL without fetching it yet.
      const childLinks = rootCatalog.getChildLinks();
      const latestLink = childLinks.find((link) => link.latest === true);
      if (!latestLink) throw new Error("No latest release found in root catalog");
      const latestReleaseUrl = resolveUrl(rootUrl, latestLink.href);

      // Step 3 — check localStorage. If the release URL matches, skip the
      // release catalog + all 6 theme catalog fetches entirely.
      const cached = readCache();
      if (cached?.releaseUrl === latestReleaseUrl) {
        return (cachedStacData = {
          pmtilesUrls: new Map(Object.entries(cached.pmtilesUrls)),
          releaseId: cached.releaseId,
          releaseUrl: latestReleaseUrl,
          themeCatalogs: null,
          rootUrl,
        });
      }

      // Step 4 — cache miss: fetch release catalog + all theme catalogs.
      const { stacObject: releaseCatalog, url: releaseUrl } = await fetchStacObject(latestReleaseUrl);
      const themeCatalogs = await getThemeCatalogs(releaseCatalog, releaseUrl);

      const pmtilesUrls = new Map();
      for (const { catalog, url, title } of themeCatalogs) {
        const pmtilesUrl = getPmtilesUrl(catalog, url);
        if (pmtilesUrl) {
          pmtilesUrls.set(catalog.id || title, pmtilesUrl);
        }
      }

      writeCache(latestReleaseUrl, releaseCatalog.id, pmtilesUrls);

      return (cachedStacData = {
        pmtilesUrls,
        releaseId: releaseCatalog.id,
        releaseUrl,
        themeCatalogs,
        rootUrl,
      });
    })().catch((error) => {
      stacDataPromise = null;
      throw error;
    });
  }

  return stacDataPromise;
}

/**
 * Main function to load all PMTiles URLs from the STAC catalog
 * Returns a Map of theme name -> PMTiles URL
 */
export async function loadPmtilesFromStac() {
  const data = await loadStacData();
  return data.pmtilesUrls;
}

/**
 * Gets the cached STAC data including release info
 * Returns an object with pmtilesUrls, releaseId, releaseUrl, themeCatalogs, rootUrl
 */
export async function getStacData() {
  return loadStacData();
}

/**
 * Gets the release version from the STAC catalog
 */
export async function getLatestReleaseVersion() {
  const data = await loadStacData();
  return data.releaseId;
}

/**
 * Gets the release URL from the STAC catalog
 */
export async function getLatestReleaseUrl() {
  const data = await loadStacData();
  return data.releaseUrl;
}
