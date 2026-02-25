/**
 * Shared helpers for MapLibre style validation.
 *
 * Used by:
 *   - scripts/dont-dream-its-overture.mjs  (ESM, via createRequire)
 *   - __tests__/schemaValidation.test.js   (CJS, via @/lib/styleValidation)
 */

/**
 * Replace $-prefixed token strings with placeholder values so the raw
 * layer JSON can pass through MapLibre style-spec validation.
 */
function stripTokenRefs(obj) {
  if (typeof obj === "string" && obj.startsWith("$")) {
    return "rgba(0,0,0,1)";
  }
  if (Array.isArray(obj)) {
    return obj.map(stripTokenRefs);
  }
  if (obj && typeof obj === "object") {
    const result = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = stripTokenRefs(v);
    }
    return result;
  }
  return obj;
}

/**
 * Collect all field names referenced via ["get", "fieldname"] in
 * MapLibre expressions (filters, paint, layout).
 */
function collectFieldRefs(expr, set) {
  if (!Array.isArray(expr)) return;
  if (expr[0] === "get" && typeof expr[1] === "string") {
    set.add(expr[1]);
  }
  for (const item of expr) {
    if (Array.isArray(item)) collectFieldRefs(item, set);
  }
}

/**
 * Collect literal values matched against a specific field in filter
 * expressions.
 *
 * Handles:
 *   ["==", ["get", "subtype"], "forest"]        → adds "forest"
 *   ["match", ["get", "class"], ["a","b"], …]   → adds "a", "b"
 *   ["in", ["get", "class"], ["literal", [...]]] → adds all items
 */
function collectFilterValues(expr, fieldName, set) {
  if (!Array.isArray(expr)) return;
  const op = expr[0];

  if ((op === "==" || op === "!=") &&
      Array.isArray(expr[1]) && expr[1][0] === "get" && expr[1][1] === fieldName &&
      typeof expr[2] === "string") {
    set.add(expr[2]);
  }

  if (op === "match" && Array.isArray(expr[1]) &&
      expr[1][0] === "get" && expr[1][1] === fieldName) {
    for (let i = 2; i < expr.length - 1; i += 2) {
      const val = expr[i];
      if (typeof val === "string") set.add(val);
      if (Array.isArray(val)) val.forEach((v) => typeof v === "string" && set.add(v));
    }
  }

  if (op === "in" && Array.isArray(expr[1]) &&
      expr[1][0] === "get" && expr[1][1] === fieldName) {
    const litArr = expr[2];
    if (Array.isArray(litArr) && litArr[0] === "literal" && Array.isArray(litArr[1])) {
      litArr[1].forEach((v) => typeof v === "string" && set.add(v));
    }
  }

  if (op === "all" || op === "any" || op === "none") {
    for (let i = 1; i < expr.length; i++) {
      collectFilterValues(expr[i], fieldName, set);
    }
  }

  // Recurse into nested expressions
  for (const item of expr) {
    if (Array.isArray(item) && typeof item[0] === "string" &&
        ["all", "any", "none", "!", "match", "==", "!=", "in"].includes(item[0])) {
      collectFilterValues(item, fieldName, set);
    }
  }
}

module.exports = { stripTokenRefs, collectFieldRefs, collectFilterValues };
