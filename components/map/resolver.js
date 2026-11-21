/**
 * Resolves the layer fragments and design tokens into MapLibre layer specs.
 *
 * CommonJS so one copy serves every consumer:
 *   - the app and Jest, via components/map/index.js
 *   - scripts/build-style-bundle.mjs (Node, via createRequire)
 */
const colors = require("./tokens/primitive/colors.json");
const fonts = require("./tokens/primitive/fonts.json");
const semanticExploreColors = require("./tokens/semantic/explore/colors.json");
const semanticInspectColors = require("./tokens/semantic/inspect/colors.json");
const semanticFonts = require("./tokens/semantic/fonts.json");
const exploreMode = require("./tokens/component/explore.json");
const defaultLayers = require("./layers/explore/manifest.json");
const inspectLayers = require("./layers/inspect/manifest.json");

// Assemble primitives from split files
const primitives = { color: colors, font: fonts };

// ---------------------------------------------------------------------------
// Resolve $globals references within semantic theme token definitions
// ---------------------------------------------------------------------------

// Deep merge utility
function merge(base, override) {
  if (!override) return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key]) &&
      typeof override[key] === "object" &&
      !Array.isArray(override[key])
    ) {
      result[key] = merge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

// Pass 1: Resolve $globals.* in semantic tokens
function resolveGlobals(val) {
  if (typeof val === "string" && val.startsWith("$globals.")) {
    const parts = val.slice("$globals.".length).split(".");
    let resolved = primitives;
    for (const part of parts) {
      resolved = resolved?.[part];
      if (resolved === undefined) return val;
    }
    return resolved;
  }
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const result = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = resolveGlobals(v);
    }
    return result;
  }
  if (Array.isArray(val)) {
    return val.map(resolveGlobals);
  }
  return val;
}

const resolvedSemantics = {};
for (const key of Object.keys(semanticExploreColors)) {
  resolvedSemantics[key] = resolveGlobals(semanticExploreColors[key]);
}
resolvedSemantics.inspect = {};
for (const key of Object.keys(semanticInspectColors)) {
  resolvedSemantics.inspect[key] = resolveGlobals(semanticInspectColors[key]);
}

const resolvedSemanticFonts = {};
for (const key of Object.keys(semanticFonts)) {
  resolvedSemanticFonts[key] = resolveGlobals(semanticFonts[key]);
}

// Pass 2: Resolve $semantic.* and $globals.* in explore mode tokens
function resolveExplore(val) {
  if (typeof val === "string" && val.startsWith("$semantic.")) {
    const parts = val.slice("$semantic.".length).split(".");
    let resolved = resolvedSemantics;
    for (const part of parts) {
      resolved = resolved?.[part];
      if (resolved === undefined) return val;
    }
    return resolved;
  }
  if (typeof val === "string" && val.startsWith("$globals.")) {
    const parts = val.slice("$globals.".length).split(".");
    let resolved = primitives;
    for (const part of parts) {
      resolved = resolved?.[part];
      if (resolved === undefined) return val;
    }
    return resolved;
  }
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const result = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = resolveExplore(v);
    }
    return result;
  }
  if (Array.isArray(val)) {
    return val.map(resolveExplore);
  }
  return val;
}

const resolvedExplore = {};
for (const key of Object.keys(exploreMode)) {
  resolvedExplore[key] = resolveExplore(exploreMode[key]);
}

// Merge resolved explore renditions with resolved semantic fonts.
// Semantic fonts are structured to match the component hierarchy
// (e.g. divisions.division, transportation.segment) so they merge
// directly into the correct themeTokens paths.
const themeTokens = merge(resolvedExplore, resolvedSemanticFonts);

const globals = primitives;

// ---------------------------------------------------------------------------
// Token access
// ---------------------------------------------------------------------------

/**
 * Get the token data for a specific theme/type from theme tokens.
 * Returns color/font/selection values.
 */
function getLayerTokens(theme, type) {
  return themeTokens[theme]?.[type];
}

/**
 * Get inspect tokens for a specific theme/type.
 */
function getInspectTokens(theme, type) {
  return themeTokens["inspect"]?.[type];
}

// ---------------------------------------------------------------------------
// Layer spec resolution
// ---------------------------------------------------------------------------

/**
 * Build a MapLibre expression that extracts a string value from a
 * stringified JSON column.  Usage in layer specs: "$extract:column.key"
 * e.g. "$extract:categories.primary"
 */
function buildExtractExpression(column, key) {
  return [
    "let",
    "str", ["to-string", ["get", column]],
    "key", `"${key}":"`,
    [
      "let",
      "idx", ["index-of", ["var", "key"], ["var", "str"]],
      [
        "case",
        [">=", ["var", "idx"], 0],
        [
          "let",
          "start", ["+", ["var", "idx"], ["length", ["var", "key"]]],
          ["slice", ["var", "str"], ["var", "start"], ["index-of", "\"", ["var", "str"], ["var", "start"]]]
        ],
        ""
      ]
    ]
  ];
}

/**
 * Resolve $theme.type.property references in a layer spec against tokens.
 * Supports $globals.key.subkey for primitives.
 * Supports $extract:column.key for stringified JSON column access.
 */
function resolveLayerSpec(spec) {
  const json = JSON.stringify(spec);
  const resolved = json.replace(/"\$([^"]+)"/g, (match, path) => {
    const parts = path.split(".");

    // $extract:categories.primary → buildExtractExpression("categories", "primary")
    if (parts[0].startsWith("extract:")) {
      const column = parts[0].slice("extract:".length);
      const key = parts[1];
      return JSON.stringify(buildExtractExpression(column, key));
    }

    // $globals.color.transparent → primitives.color.transparent
    if (parts[0] === "globals") {
      let val = globals;
      for (let i = 1; i < parts.length; i++) {
        val = val?.[parts[i]];
        if (val === undefined) return match;
      }
      return JSON.stringify(val);
    }

    // $theme.type.property → themeTokens[theme][type].property
    const theme = parts[0];
    const type = parts[1];
    let val = themeTokens[theme]?.[type];
    if (!val) return match;
    for (let i = 2; i < parts.length; i++) {
      val = val?.[parts[i]];
      if (val === undefined) return match;
    }
    return JSON.stringify(val);
  });
  return JSON.parse(resolved);
}

// ---------------------------------------------------------------------------
// Resolve layer lists from path-based manifests
// ---------------------------------------------------------------------------

function resolveLayers(paths) {
  return paths.map((p) => {
    const spec = require(`./${p}`);
    // "layers/explore/base/water/ocean/fill.json" → "base-water-ocean-fill"
    const id = p
      .replace(/^layers\/(?:explore|inspect)\//, "")
      .replace(/\.json$/, "")
      .replace(/\//g, "-");
    return resolveLayerSpec({ ...spec, id });
  });
}

const defaultLayerSpecs = resolveLayers(defaultLayers);
const inspectLayerSpecs = resolveLayers(inspectLayers);

module.exports = {
  globals,
  getLayerTokens,
  getInspectTokens,
  defaultLayerSpecs,
  inspectLayerSpecs,
};
