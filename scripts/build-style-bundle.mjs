#!/usr/bin/env node
/**
 * Build the publishable style bundle from the same layer fragments and tokens
 * the site renders. See lib/styleBundle.js for the bundle format.
 *
 * Usage:
 *   node scripts/build-style-bundle.mjs [--out <path>] [--tiles-url <template>]
 *                                       [--glyphs <url>] [--sprite <url>]
 */

import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
import { parseArgs } from "node:util";
import { validateStyleMin } from "@maplibre/maplibre-gl-style-spec";

const require = createRequire(import.meta.url);
const { defaultLayerSpecs, inspectLayerSpecs } = require("../components/map/resolver.js");
const { buildStyleBundle, findUnresolvedRefs, DEFAULT_TILES_URL } = require("../lib/styleBundle.js");

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_OUT = path.resolve(__dirname, "../dist/overture-styles.json");

let values;
try {
  ({ values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      help: { type: "boolean", short: "h" },
      out: { type: "string" },
      "tiles-url": { type: "string" },
      glyphs: { type: "string" },
      sprite: { type: "string" },
    },
    strict: true,
    allowPositionals: false,
  }));
} catch (error) {
  console.error(`Invalid arguments: ${error.message}`);
  process.exit(2);
}

for (const [name, value] of Object.entries(values)) {
  if (typeof value === "string" && !value.trim()) {
    console.error(`--${name} must not be empty`);
    process.exit(2);
  }
}

if (values.help) {
  console.log(`build-style-bundle

Options:
  -h, --help              Show this help
  --out <path>            Output file (default: dist/overture-styles.json)
  --tiles-url <template>  Source URL template (default: ${DEFAULT_TILES_URL})
  --glyphs <url>          Glyphs URL to set on every style (default: none)
  --sprite <url>          Sprite URL to set on every style (default: none)
`);
} else {
  const out = path.resolve(values.out || DEFAULT_OUT);
  const glyphs = values.glyphs;
  const bundle = buildStyleBundle({
    variants: { explore: defaultLayerSpecs, inspect: inspectLayerSpecs },
    tilesUrl: values["tiles-url"],
    glyphs,
    sprite: values.sprite,
  });

  const problems = findUnresolvedRefs(bundle).map((p) => `unresolved token at ${p}`);
  for (const [key, { styles }] of Object.entries(bundle.collections)) {
    for (const [variant, style] of Object.entries(styles)) {
      for (const error of validateStyleMin(style)) {
        problems.push(`${key} (${variant}): ${error.message}`);
      }
    }
  }
  if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
  }

  const json = `${JSON.stringify(bundle, null, 2)}\n`;
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, json);

  const styleCount = Object.values(bundle.collections).reduce((n, c) => n + Object.keys(c.styles).length, 0);
  const sha256 = crypto.createHash("sha256").update(json).digest("hex");
  console.log(`Wrote ${styleCount} styles for ${Object.keys(bundle.collections).length} collections to ${path.relative(process.cwd(), out)}`);
  console.log(`sha256 ${sha256}`);
}
