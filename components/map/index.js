import overture from "./overture.json";
import overtureInspect from "./overture-inspect.json";
import { defaultLayers, inspectLayers } from "./layer-lists";

// ---------------------------------------------------------------------------
// Resolve $globals references within overture token definitions
// ---------------------------------------------------------------------------

const overtureGlobals = overture["overture:globals"];

function resolveTokenValue(val) {
  if (typeof val === "string" && val.startsWith("$globals.")) {
    const parts = val.slice("$globals.".length).split(".");
    let resolved = overtureGlobals;
    for (const part of parts) {
      resolved = resolved?.[part];
      if (resolved === undefined) return val;
    }
    return resolved;
  }
  if (val && typeof val === "object" && !Array.isArray(val)) {
    const result = {};
    for (const [k, v] of Object.entries(val)) {
      result[k] = resolveTokenValue(v);
    }
    return result;
  }
  if (Array.isArray(val)) {
    return val.map(resolveTokenValue);
  }
  return val;
}

for (const key of Object.keys(overture)) {
  if (key.startsWith("overture:")) continue;
  overture[key] = resolveTokenValue(overture[key]);
}

// ---------------------------------------------------------------------------
// Groups for LayerTree
// ---------------------------------------------------------------------------

export const themes = overture["overture:themes"];
export const groups = overture["overture:groups"];
export const globals = overture["overture:globals"];

// ---------------------------------------------------------------------------
// Token access
// ---------------------------------------------------------------------------

/**
 * Get the token data for a specific theme/type from overture.json.
 * Returns color/font/selection values.
 */
export function getLayerTokens(theme, type) {
  return overture[theme]?.[type];
}

/**
 * Deep-merge override onto base. Returns a new object.
 * Only merges plain objects; arrays and primitives are replaced.
 */
function deepMerge(base, override) {
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
      result[key] = deepMerge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

/**
 * Get inspect tokens — merge overture base + inspect overrides.
 */
export function getInspectTokens(theme, type) {
  const base = overture[theme]?.[type] || {};
  const inspect = overtureInspect[theme]?.[type] || {};
  return deepMerge(base, inspect);
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
 * Resolve $theme.type.property references in a layer spec against overture tokens.
 * Supports $globals.key.subkey for shared variables.
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

    // $globals.color.selection → overture["overture:globals"].color.selection
    if (parts[0] === "globals") {
      let val = globals;
      for (let i = 1; i < parts.length; i++) {
        val = val?.[parts[i]];
        if (val === undefined) return match;
      }
      return JSON.stringify(val);
    }

    // $theme.type.property → overture[theme][type].property
    const theme = parts[0];
    const type = parts[1];
    let val = overture[theme]?.[type];
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
