#!/usr/bin/env node

/**
 * Copies the web worker and library modules from node_modules into public/ so they can
 * be served locally instead of fetched from an external CDN.
 *
 * Run automatically as the `postinstall` npm script after dependencies are installed.
 *
 * Copying the web worker module is a requirement of MapLibre GL JS v6:
 * https://maplibre.org/maplibre-gl-js/docs/#esm
 */

import { copyFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

mkdirSync(resolve(root, "public"), { recursive: true });
copyFileSync(
  resolve(root, "node_modules/maplibre-gl/dist/maplibre-gl-shared.mjs"),
  resolve(root, "public/maplibre-gl-shared.mjs")
);

copyFileSync(
  resolve(root, "node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs"),
  resolve(root, "public/maplibre-gl-worker.mjs")
);
