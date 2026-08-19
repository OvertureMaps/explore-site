/**
 * Compatibility shim for ESLint v10.
 *
 * ESLint v10 requires the scopeManager returned by parseForESLint() to expose
 * an addGlobals() method (added in eslint-scope v9). The Babel-based parser
 * bundled inside Next.js ships an older scope-manager that lacks this method.
 *
 * This shim delegates to the Next.js babel parser but strips the scopeManager
 * from its parseForESLint() result. ESLint v10 falls back to its own built-in
 * scope analysis (eslint-scope v9) when no scopeManager is returned, which
 * does implement addGlobals() correctly.
 */
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const babelParser = require("eslint-config-next/parser");

export function parse(code, options) {
  return babelParser.parse(code, options);
}

export function parseForESLint(code, options) {
  if (typeof babelParser.parseForESLint !== "function") {
    return { ast: babelParser.parse(code, options) };
  }
  const { scopeManager: _dropped, ...result } =
    babelParser.parseForESLint(code, options);
  return result;
}

export const meta = {
  name: "eslint-parser-compat",
  version: "1.0.0",
};
