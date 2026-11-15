/**
 * Builds the publishable style bundle: one standalone MapLibre style per
 * Overture collection (theme/type), for each style variant.
 *
 * Styles carry RELEASE_PLACEHOLDER in their PMTiles URLs, so one bundle serves
 * every release. Consumers (the STAC generator) substitute the release id.
 *
 * Used by:
 *   - scripts/build-style-bundle.mjs  (ESM, via createRequire)
 *   - __tests__/styleBundle.test.js
 */

const BUNDLE_FORMAT_VERSION = 1;
const RELEASE_PLACEHOLDER = "{release}";
const THEME_PLACEHOLDER = "{theme}";
const DEFAULT_TILES_URL = `pmtiles://https://tiles.overturemaps.org/${RELEASE_PLACEHOLDER}/${THEME_PLACEHOLDER}.pmtiles`;
const ATTRIBUTION =
  '<a href="https://openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>, <a href="https://overturemaps.org" target="_blank">Overture Maps Foundation</a>';

/**
 * @param {object} options
 * @param {Record<string, object[]>} options.variants Resolved layer specs per
 *   variant name. Key order sets the default: a collection's default style is
 *   the first variant that has layers for it.
 * @param {string} [options.tilesUrl] Source URL template with {release} and {theme}.
 * @param {string} [options.glyphs] Optional glyphs URL for every style.
 * @param {string} [options.sprite] Optional sprite URL for every style.
 */
function buildStyleBundle({ variants, tilesUrl = DEFAULT_TILES_URL, glyphs, sprite }) {
  if (!tilesUrl.includes(RELEASE_PLACEHOLDER)) {
    throw new Error(`tilesUrl must contain ${RELEASE_PLACEHOLDER}: ${tilesUrl}`);
  }
  if (!tilesUrl.includes(THEME_PLACEHOLDER)) {
    throw new Error(`tilesUrl must contain ${THEME_PLACEHOLDER}: ${tilesUrl}`);
  }

  const collections = {};
  for (const [variant, specs] of Object.entries(variants)) {
    for (const spec of specs) {
      const theme = spec.metadata?.["overture:theme"];
      const type = spec.metadata?.["overture:type"];
      // Layers without a collection (e.g. background) belong to the basemap, not a collection style
      if (!theme || !type) continue;

      const key = `${theme}/${type}`;
      collections[key] ??= { default: variant, styles: {} };
      const style = (collections[key].styles[variant] ??= newStyle(theme, type, variant, glyphs, sprite));

      if (!style.sources[spec.source]) {
        style.sources[spec.source] = {
          type: "vector",
          url: tilesUrl.replaceAll(THEME_PLACEHOLDER, spec.source),
          promoteId: "id",
          attribution: ATTRIBUTION,
        };
      }
      style.layers.push(JSON.parse(JSON.stringify(spec)));
    }
  }

  const sorted = {};
  for (const key of Object.keys(collections).sort()) sorted[key] = collections[key];

  return {
    format_version: BUNDLE_FORMAT_VERSION,
    release_placeholder: RELEASE_PLACEHOLDER,
    collections: sorted,
  };
}

function newStyle(theme, type, variant, glyphs, sprite) {
  const style = {
    version: 8,
    name: `Overture ${theme}/${type} (${variant})`,
    metadata: {
      "overture:theme": theme,
      "overture:type": type,
      "overture:style": variant,
    },
    sources: {},
    layers: [],
  };
  if (glyphs) style.glyphs = glyphs;
  if (sprite) style.sprite = sprite;
  return style;
}

/**
 * Return the paths of string values that still look like unresolved
 * `$token` references, e.g. ["collections.base/water.styles.explore.layers.0.paint.fill-color"].
 */
function findUnresolvedRefs(obj, path = []) {
  if (typeof obj === "string") {
    return obj.startsWith("$") ? [path.join(".")] : [];
  }
  if (obj && typeof obj === "object") {
    return Object.entries(obj).flatMap(([k, v]) => findUnresolvedRefs(v, [...path, k]));
  }
  return [];
}

module.exports = {
  BUNDLE_FORMAT_VERSION,
  RELEASE_PLACEHOLDER,
  DEFAULT_TILES_URL,
  buildStyleBundle,
  findUnresolvedRefs,
};
