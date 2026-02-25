import overture from "./overture.json";
import colors from "./tokens/primitive/colors.json";
import fonts from "./tokens/primitive/fonts.json";
import semanticColors from "./tokens/semantic/colors.json";
import semanticFonts from "./tokens/semantic/fonts.json";
import overtureInspect from "./overture-inspect.json";
import inspectMode from "./modes/inspect/inspect.json";
import exploreMode from "./modes/explore/explore.json";
import defaultLayers from "./modes/explore/layers.json";
import inspectLayers from "./modes/inspect/layers.json";

// Assemble primitives from split files
const primitives = { color: { ...colors, inspect: inspectMode.color }, font: fonts };

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
for (const key of Object.keys(semanticColors)) {
  resolvedSemantics[key] = resolveGlobals(semanticColors[key]);
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

// Merge resolved explore renditions with resolved semantic fonts
const themeTokens = merge(resolvedExplore, resolvedSemanticFonts);

// Resolve overture inspect tokens
for (const key of Object.keys(overtureInspect)) {
  overtureInspect[key] = resolveGlobals(overtureInspect[key]);
}

// ---------------------------------------------------------------------------
// Groups for LayerTree
// ---------------------------------------------------------------------------

export const themes = overture["overture:themes"];
export const groups = overture["overture:groups"];
export const globals = primitives;

// ---------------------------------------------------------------------------
// Token access
// ---------------------------------------------------------------------------

/**
 * Get the token data for a specific theme/type from theme tokens.
 * Returns color/font/selection values.
 */
export function getLayerTokens(theme, type) {
  return themeTokens[theme]?.[type];
}

/**
 * Get inspect tokens — merge semantic base + inspect overrides.
 */
export function getInspectTokens(theme, type) {
  const base = themeTokens[theme]?.[type] || {};
  const inspect = overtureInspect[theme]?.[type] || {};
  return merge(base, inspect);
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
  return paths.map((path) => {
    const spec = require(`./${path}`);
    return resolveLayerSpec(spec);
  });
}

export const defaultLayerSpecs = resolveLayers(defaultLayers);
export const inspectLayerSpecs = resolveLayers(inspectLayers);
