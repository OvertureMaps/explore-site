import create from "stac-js";

const STAC_CATALOG_URL =
  "https://staging.overturemaps.org/stac/pr/21/catalog.json";

// Cached STAC data
let cachedStacData = null;
let stacDataPromise = null;

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
 * Gets the latest release catalog from the root catalog
 */
async function getLatestRelease(rootCatalog, rootUrl) {
  // Find the child link with latest: true
  const childLinks = rootCatalog.getChildLinks();

  if (childLinks.length === 0) {
    throw new Error("No child catalogs found in root catalog");
  }

  // Find the child with latest: true
  const latestReleaseLink = childLinks.find((link) => link.latest === true);

  if (!latestReleaseLink) {
    throw new Error("No latest release found in root catalog");
  }

  const latestReleaseUrl = resolveUrl(rootUrl, latestReleaseLink.href);

  return fetchStacObject(latestReleaseUrl);
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
 * Loads and caches all STAC data from the catalog
 * Returns an object with pmtilesUrls, releaseId, releaseUrl, and themeCatalogs
 */
async function loadStacData() {
  if (cachedStacData) {
    return cachedStacData;
  }

  if (!stacDataPromise) {
    stacDataPromise = (async () => {
      // Fetch the root catalog
      const { stacObject: rootCatalog, url: rootUrl } = await fetchStacObject(STAC_CATALOG_URL);

      // Get the latest release
      const { stacObject: releaseCatalog, url: releaseUrl } = await getLatestRelease(rootCatalog, rootUrl);

      // Get all theme catalogs
      const themeCatalogs = await getThemeCatalogs(releaseCatalog, releaseUrl);

      // Extract PMTiles URLs from each theme catalog
      const pmtilesUrls = new Map();

      for (const { catalog, url, title } of themeCatalogs) {
        const pmtilesUrl = getPmtilesUrl(catalog, url);
        if (pmtilesUrl) {
          // Use the catalog id as the theme name (e.g., "buildings", "places")
          const themeName = catalog.id || title;
          pmtilesUrls.set(themeName, pmtilesUrl);
        }
      }

      cachedStacData = {
        pmtilesUrls,
        releaseId: releaseCatalog.id,
        releaseUrl,
        themeCatalogs,
        rootUrl,
      };

      return cachedStacData;
    })().catch((error) => {
      stacDataPromise = null; // Allow retry on next call
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
