#!/usr/bin/env node

/**
 * Copies the Mapbox RTL text plugin from node_modules into public/ so it can
 * be served locally instead of fetched from an external CDN.
 *
 * Run automatically as the `prebuild` npm script before `next build`.
 */

import { copyFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

mkdirSync(resolve(root, "public"), { recursive: true });
copyFileSync(
  resolve(root, "node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js"),
  resolve(root, "public/mapbox-gl-rtl-text.js")
);
