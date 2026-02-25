#!/usr/bin/env node

/**
 * dont-dream-its-overture
 *
 * CLI for building Overture Maps schema/tile specs and validating
 * MapLibre GL style layers against them.
 *
 * Usage:
 *   node scripts/dont-dream-its-overture.mjs --build-schema [--schema-release v1.16.0]
 *   node scripts/dont-dream-its-overture.mjs --build-tiles [--tiles-release 2026-02-18.0]
 *   node scripts/dont-dream-its-overture.mjs --validate-style <dir>
 *   node scripts/dont-dream-its-overture.mjs --all
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { stripTokenRefs, collectFieldRefs, collectFilterValues } = require("../lib/styleValidation.js");

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Defaults ─────────────────────────────────────────

const SCHEMA_RELEASE = "v1.16.0";
const TILES_RELEASE = "2026-02-18.0";
const MAP_DIR = path.resolve(__dirname, "../lib/map-styles");
const SCHEMA_OUT = path.join(MAP_DIR, "schema.json");
const TILES_OUT = path.join(MAP_DIR, "tiles.json");
const STYLE_DIR = MAP_DIR;
const REPORT_OUT = path.join(MAP_DIR, "STYLE-AUDIT.md");

// ── Arg parsing ──────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return i !== -1 ? (args[i + 1] || true) : undefined;
}
const hasFlag = (name) => args.includes(name);

const doBuildSchema = hasFlag("--build-schema") || hasFlag("--all");
const doBuildTiles = hasFlag("--build-tiles") || hasFlag("--all");
const doValidateStyle = hasFlag("--validate-style") || hasFlag("--all");
const schemaRelease = getArg("--schema-release") || SCHEMA_RELEASE;
const tilesRelease = getArg("--tiles-release") || TILES_RELEASE;
const styleDir =
  (hasFlag("--validate-style") && getArg("--validate-style") !== true
    ? getArg("--validate-style")
    : undefined) || STYLE_DIR;

if (!doBuildSchema && !doBuildTiles && !doValidateStyle) {
  console.log(`dont-dream-its-overture

Usage:
  --build-schema              Build schema.json from Overture schema YAML
  --build-tiles               Build tiles.json from Overture PMTiles metadata
  --validate-style [dir]      Validate style layers against schema + tiles + spec
  --all                       Run all three steps

Options:
  --schema-release <tag>      Schema git tag (default: ${SCHEMA_RELEASE})
  --tiles-release <version>   Tiles release (default: ${TILES_RELEASE})
  --schema-path <path>        Local schema dir (overrides --schema-release)
`);
  process.exit(0);
}

// ══════════════════════════════════════════════════════
// BUILD SCHEMA
// ══════════════════════════════════════════════════════

async function buildSchema() {
  const yaml = (await import("js-yaml")).default;

  // Determine schema source: local path or git tag checkout
  let schemaPath = getArg("--schema-path");
  if (!schemaPath) {
    schemaPath = path.resolve(__dirname, "../../schema/schema");
    // If pinned to a release, checkout that tag
    if (schemaRelease && fs.existsSync(path.resolve(schemaPath, ".."))) {
      const repoDir = path.resolve(schemaPath, "..");
      const { execSync } = await import("child_process");
      const execOpts = { cwd: __dirname, stdio: "pipe" };
      try {
        execSync(`git -C "${repoDir}" fetch --tags --quiet`, execOpts);
      } catch { /* offline is ok */ }
      execSync(`git -C "${repoDir}" checkout --quiet "${schemaRelease}"`, execOpts);
      console.log(`Schema: checked out ${schemaRelease}`);
    }
  }
  schemaPath = path.resolve(schemaPath);

  const yamlCache = new Map();
  function readYaml(filePath) {
    if (yamlCache.has(filePath)) return yamlCache.get(filePath);
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory())
      return undefined;
    const doc = yaml.load(fs.readFileSync(filePath, "utf8"));
    yamlCache.set(filePath, doc);
    return doc;
  }

  function resolveRef(refPath, baseDir) {
    if (refPath.startsWith("http://") || refPath.startsWith("https://"))
      return undefined;
    const [filePart, pointer] = refPath.split("#");
    const absFile = path.resolve(baseDir, filePart);
    const doc = readYaml(absFile);
    if (!doc) return undefined;
    if (!pointer) return doc;
    const segments = pointer.split("/").filter(Boolean);
    let node = doc;
    for (const seg of segments) {
      if (!node || typeof node !== "object") return undefined;
      node = node[seg];
    }
    return node;
  }

  function resolveLocalRef(ref, localDefs) {
    if (!ref || !ref.startsWith("#/")) return undefined;
    const pointer = ref.split("/").filter(Boolean);
    let node = { $defs: localDefs };
    for (const seg of pointer) {
      if (!node || typeof node !== "object") return undefined;
      node = node[seg];
    }
    return node;
  }

  const META_KEYS = [
    "type", "enum", "const",
    "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum",
    "minLength", "maxLength",
    "minItems", "maxItems", "uniqueItems",
    "pattern", "format", "default", "description",
  ];

  function resolveField(field, baseDir, localDefs) {
    if (!field || typeof field !== "object") return undefined;
    if (field["$ref"]) {
      if (field["$ref"].startsWith("#/")) {
        const resolved = resolveLocalRef(field["$ref"], localDefs);
        if (resolved) return resolveField(resolved, baseDir, localDefs);
      } else {
        const resolved = resolveRef(field["$ref"], baseDir);
        if (resolved) return resolveField(resolved, baseDir, localDefs);
      }
      return undefined;
    }
    if (field.allOf) {
      const merged = { ...field };
      delete merged.allOf;
      for (const entry of field.allOf) {
        if (entry["$ref"]) {
          const resolved = entry["$ref"].startsWith("#/")
            ? resolveLocalRef(entry["$ref"], localDefs)
            : resolveRef(entry["$ref"], baseDir);
          if (resolved) {
            const rf = resolveField(resolved, baseDir, localDefs);
            if (rf) Object.assign(merged, rf);
          }
        } else {
          Object.assign(merged, entry);
        }
      }
      return merged;
    }
    return field;
  }

  function extractMeta(field, baseDir, localDefs) {
    const resolved = resolveField(field, baseDir, localDefs);
    if (!resolved) return undefined;
    const meta = {};
    for (const key of META_KEYS) {
      if (resolved[key] !== undefined) meta[key] = resolved[key];
    }
    if (Object.keys(meta).length === 0) return undefined;
    return meta;
  }

  function extractDefs(defsPath) {
    if (!fs.existsSync(defsPath)) return {};
    const doc = readYaml(defsPath);
    if (!doc) return {};
    const result = {};
    const defs = doc["$defs"];
    if (!defs) return result;
    const baseDir = path.dirname(defsPath);

    if (defs.propertyDefinitions) {
      for (const [name, def] of Object.entries(defs.propertyDefinitions)) {
        const meta = extractMeta(def, baseDir, defs);
        if (meta) result[name] = meta;
      }
    }
    if (defs.propertyContainers) {
      for (const [cn, container] of Object.entries(defs.propertyContainers)) {
        if (!container.properties) continue;
        for (const [pn, pd] of Object.entries(container.properties)) {
          const meta = extractMeta(pd, baseDir, defs);
          if (meta) result[`${cn}.${pn}`] = meta;
          if (pd.properties) {
            for (const [sn, sd] of Object.entries(pd.properties)) {
              const sm = extractMeta(sd, baseDir, defs);
              if (sm) result[sn] = sm;
            }
          }
        }
      }
    }
    if (defs.typeDefinitions) {
      for (const [name, def] of Object.entries(defs.typeDefinitions)) {
        const meta = extractMeta(def, baseDir, defs);
        if (meta) result[name] = meta;
      }
    }
    return result;
  }

  function extractTypeProperties(doc, typeDir) {
    const result = {};
    const props = doc.properties?.properties?.properties;
    if (!props) return result;
    const localDefs = doc["$defs"] || {};
    for (const [key, value] of Object.entries(props)) {
      if (!value || typeof value !== "object") continue;
      const meta = extractMeta(value, typeDir, localDefs);
      if (meta) result[key] = meta;
    }
    if (localDefs.propertyDefinitions) {
      for (const [name, def] of Object.entries(localDefs.propertyDefinitions)) {
        if (result[name]) continue;
        const meta = extractMeta(def, typeDir, localDefs);
        if (meta) result[name] = meta;
      }
    }
    if (localDefs.propertyContainers) {
      for (const [, container] of Object.entries(localDefs.propertyContainers)) {
        if (!container.properties) continue;
        for (const [pn, pd] of Object.entries(container.properties)) {
          if (result[pn]) continue;
          const meta = extractMeta(pd, typeDir, localDefs);
          if (meta) result[pn] = meta;
        }
      }
    }
    return result;
  }

  // Parse schema.yaml
  const schemaDoc = readYaml(path.join(schemaPath, "schema.yaml"));
  const themeTypes = {};
  for (const entry of schemaDoc.oneOf) {
    const ifBlock = entry.if;
    if (!ifBlock) continue;
    const themeProp = ifBlock.properties?.properties?.properties?.theme;
    const typeProp = ifBlock.properties?.properties?.properties?.type;
    if (!themeProp?.enum?.[0] || !typeProp?.enum?.[0]) continue;
    const theme = themeProp.enum[0];
    const type = typeProp.enum[0];
    if (!themeTypes[theme]) themeTypes[theme] = [];
    themeTypes[theme].push(type);
  }

  const rootDefs = extractDefs(path.join(schemaPath, "defs.yaml"));
  const output = {
    $generated: new Date().toISOString().split("T")[0],
    $source: "https://github.com/OvertureMaps/schema",
    $release: schemaRelease,
    defs: { root: rootDefs },
    themes: {},
  };

  for (const [theme, types] of Object.entries(themeTypes)) {
    const themeDefsPath = path.join(schemaPath, theme, "defs.yaml");
    const themeDefs = extractDefs(themeDefsPath);
    if (Object.keys(themeDefs).length > 0) output.defs[theme] = themeDefs;
    output.themes[theme] = { types: {} };

    for (const type of types) {
      const typeFile = path.join(schemaPath, theme, `${type}.yaml`);
      if (!fs.existsSync(typeFile)) {
        output.themes[theme].types[type] = {};
        continue;
      }
      const doc = readYaml(typeFile);
      const typeDir = path.dirname(typeFile);
      const allProps = extractTypeProperties(doc, typeDir);
      const typeEntry = {};

      if (allProps.subtype?.enum) typeEntry.subtypes = allProps.subtype.enum;
      if (allProps.class?.enum) typeEntry.classes = allProps.class.enum;
      if (type === "segment") {
        if (allProps.roadClass?.enum)
          typeEntry.road_classes = allProps.roadClass.enum;
        if (allProps.railClass?.enum)
          typeEntry.rail_classes = allProps.railClass.enum;
        delete typeEntry.classes;
      }

      const skip = new Set(["subtype", "class", "roadClass", "railClass"]);
      const properties = {};
      for (const [key, meta] of Object.entries(allProps)) {
        if (skip.has(key)) continue;
        properties[key] = meta;
      }
      if (Object.keys(properties).length > 0) typeEntry.properties = properties;
      output.themes[theme].types[type] = typeEntry;
    }
  }

  fs.writeFileSync(SCHEMA_OUT, JSON.stringify(output, null, 2) + "\n");
  console.log(`Schema [${schemaRelease}] → ${path.relative(process.cwd(), SCHEMA_OUT)}`);
  for (const [theme, data] of Object.entries(output.themes)) {
    console.log(`  ${theme}: ${Object.keys(data.types).join(", ")}`);
  }
  return output;
}

// ══════════════════════════════════════════════════════
// BUILD TILES
// ══════════════════════════════════════════════════════

async function buildTiles() {
  const { PMTiles } = await import("pmtiles");
  const baseUrl = `https://tiles.overturemaps.org/${tilesRelease}`;
  const themes = [
    "addresses", "base", "buildings", "divisions", "places", "transportation",
  ];

  const output = {
    $generated: new Date().toISOString().split("T")[0],
    $source: baseUrl,
    $release: tilesRelease,
    themes: {},
  };

  for (const theme of themes) {
    process.stdout.write(`Tiles: ${theme}...`);
    try {
      const src = new PMTiles(`${baseUrl}/${theme}.pmtiles`);
      const header = await src.getHeader();
      const metadata = await src.getMetadata();
      const themeEntry = {
        minzoom: header.minZoom,
        maxzoom: header.maxZoom,
        bounds: [header.minLon, header.minLat, header.maxLon, header.maxLat],
        layers: {},
      };
      if (metadata.vector_layers) {
        for (const layer of metadata.vector_layers) {
          themeEntry.layers[layer.id] = {
            minzoom: layer.minzoom,
            maxzoom: layer.maxzoom,
            fields: layer.fields,
          };
        }
      }
      output.themes[theme] = themeEntry;
      console.log(` ${Object.keys(themeEntry.layers).join(", ")}`);
    } catch (e) {
      console.log(` ERROR: ${e.message}`);
    }
  }

  fs.writeFileSync(TILES_OUT, JSON.stringify(output, null, 2) + "\n");
  console.log(
    `Tiles [${tilesRelease}] → ${path.relative(process.cwd(), TILES_OUT)}`
  );
  return output;
}

// ══════════════════════════════════════════════════════
// VALIDATE STYLE
// ══════════════════════════════════════════════════════

async function validateStyle() {
  const schema = JSON.parse(fs.readFileSync(SCHEMA_OUT, "utf8"));
  const tiles = JSON.parse(fs.readFileSync(TILES_OUT, "utf8"));

  // ── Collect all layer JSON files ───────────────────

  function findLayerFiles(dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        // Skip inspect layers — they're a separate concern
        if (entry.name === "inspect") continue;
        results.push(...findLayerFiles(full));
      } else if (entry.name.endsWith(".json") && entry.name !== "schema.json" && entry.name !== "tiles.json" && entry.name !== "STYLE-AUDIT.md") {
        results.push(full);
      }
    }
    return results;
  }

  const layerFiles = findLayerFiles(styleDir);
  const layers = [];
  const parseErrors = [];

  for (const file of layerFiles) {
    try {
      const data = JSON.parse(fs.readFileSync(file, "utf8"));
      // Only process files that look like layer definitions
      if (data.type && data.id) {
        layers.push({ file: path.relative(styleDir, file), data });
      }
    } catch (e) {
      parseErrors.push({ file: path.relative(styleDir, file), error: e.message });
    }
  }

  // ── MapLibre style spec validation ─────────────────

  const specIssues = [];
  try {
    const { validateStyleMin } = await import(
      "@maplibre/maplibre-gl-style-spec"
    );

    // Build a minimal style document wrapping all layers
    const syntheticStyle = {
      version: 8,
      name: "overture-explore",
      sources: {},
      layers: [],
    };

    // Add sources from tiles spec
    for (const [theme, themeData] of Object.entries(tiles.themes)) {
      syntheticStyle.sources[theme] = {
        type: "vector",
        url: `pmtiles://${theme}.pmtiles`,
      };
    }

    // Add layers, stripping $ token references which aren't real values
    for (const { file, data } of layers) {
      const cleaned = stripTokenRefs(JSON.parse(JSON.stringify(data)));
      syntheticStyle.layers.push(cleaned);
    }

    const errors = validateStyleMin(syntheticStyle);
    for (const err of errors) {
      specIssues.push({
        message: err.message,
        layer: err.identifier || "",
      });
    }
  } catch (e) {
    specIssues.push({ message: `Style spec validation failed: ${e.message}`, layer: "" });
  }

  // ── Schema + Tiles validation ──────────────────────

  const issues = [];

  // Build lookup maps
  const tileLayerMap = new Map(); // "theme:source-layer" → { fields, minzoom, maxzoom }
  for (const [theme, themeData] of Object.entries(tiles.themes)) {
    for (const [layerId, layerData] of Object.entries(themeData.layers)) {
      tileLayerMap.set(`${theme}:${layerId}`, layerData);
    }
  }

  const schemaTypeMap = new Map(); // "theme:type" → schema type entry
  for (const [theme, themeData] of Object.entries(schema.themes)) {
    for (const [type, typeData] of Object.entries(themeData.types)) {
      schemaTypeMap.set(`${theme}:${type}`, typeData);
    }
  }

  // Collect all schema enum values for a type
  function getSchemaValues(typeData) {
    const vals = new Set();
    if (typeData.subtypes) typeData.subtypes.forEach((s) => vals.add(s));
    if (typeData.classes) typeData.classes.forEach((c) => vals.add(c));
    if (typeData.road_classes) typeData.road_classes.forEach((c) => vals.add(c));
    if (typeData.rail_classes) typeData.rail_classes.forEach((c) => vals.add(c));
    return vals;
  }

  for (const { file, data } of layers) {
    const source = data.source;
    const sourceLayer = data["source-layer"];
    if (!source || !sourceLayer) continue;
    const tileKey = `${source}:${sourceLayer}`;
    const tileLayer = tileLayerMap.get(tileKey);
    const schemaType = schemaTypeMap.get(tileKey);

    // 1. Source-layer exists in tiles?
    if (!tileLayer) {
      issues.push({
        file,
        severity: "error",
        check: "tile-layer",
        message: `source-layer "${sourceLayer}" not found in ${source}.pmtiles`,
      });
      continue;
    }

    // 2. Zoom range checks
    if (data.minzoom !== undefined && data.minzoom < tileLayer.minzoom) {
      issues.push({
        file,
        severity: "warn",
        check: "zoom-range",
        message: `minzoom ${data.minzoom} is below tile layer minzoom ${tileLayer.minzoom}`,
      });
    }

    // 3. Field references in filters/paint/layout
    const referencedFields = new Set();
    collectFieldRefs(data.filter, referencedFields);
    collectFieldRefs(data.paint, referencedFields);
    collectFieldRefs(data.layout, referencedFields);

    for (const field of referencedFields) {
      if (field.startsWith("$") || field === "geometry-type") continue;
      if (!tileLayer.fields[field]) {
        issues.push({
          file,
          severity: "error",
          check: "tile-field",
          message: `field "${field}" not found in ${source}/${sourceLayer} tile spec`,
        });
      }
    }

    // 4. Subtype/class filter values vs schema
    if (schemaType) {
      const schemaVals = getSchemaValues(schemaType);
      if (schemaVals.size > 0) {
        const filterVals = new Set();
        collectFilterValues(data.filter, "subtype", filterVals);
        collectFilterValues(data.filter, "class", filterVals);
        for (const val of filterVals) {
          if (!schemaVals.has(val)) {
            issues.push({
              file,
              severity: "warn",
              check: "schema-value",
              message: `filter value "${val}" not in ${source}/${sourceLayer} schema enums`,
            });
          }
        }
      }
    }

    // 5. Metadata checks
    const meta = data.metadata || {};
    if (meta["overture:theme"] && meta["overture:theme"] !== source) {
      issues.push({
        file,
        severity: "warn",
        check: "metadata",
        message: `overture:theme "${meta["overture:theme"]}" does not match source "${source}"`,
      });
    }
    if (meta["overture:type"] && meta["overture:type"] !== sourceLayer) {
      issues.push({
        file,
        severity: "warn",
        check: "metadata",
        message: `overture:type "${meta["overture:type"]}" does not match source-layer "${sourceLayer}"`,
      });
    }
  }

  // ── Coverage analysis ──────────────────────────────

  const coverage = [];
  for (const [theme, themeData] of Object.entries(schema.themes)) {
    for (const [type, typeData] of Object.entries(themeData.types)) {
      if (!typeData.subtypes && !typeData.classes && !typeData.road_classes &&
          !typeData.rail_classes) continue;

      // Collect all filter values used across layers for this type
      const usedValues = new Set();
      for (const { data } of layers) {
        if (data.source !== theme || data["source-layer"] !== type) continue;
        collectFilterValues(data.filter, "subtype", usedValues);
        collectFilterValues(data.filter, "class", usedValues);
      }

      const entry = { theme, type, groups: [] };

      if (typeData.subtypes) {
        const styled = typeData.subtypes.filter((s) => usedValues.has(s));
        const unstyled = typeData.subtypes.filter((s) => !usedValues.has(s));
        entry.groups.push({
          label: "subtypes", total: typeData.subtypes.length,
          styled, unstyled,
        });
      }
      for (const key of ["classes", "road_classes", "rail_classes"]) {
        if (!typeData[key]) continue;
        const styled = typeData[key].filter((c) => usedValues.has(c));
        const unstyled = typeData[key].filter((c) => !usedValues.has(c));
        entry.groups.push({
          label: key, total: typeData[key].length, styled, unstyled,
        });
      }
      coverage.push(entry);
    }
  }

  // ── Write markdown report ──────────────────────────

  const lines = [];
  const now = new Date().toISOString().split("T")[0];
  lines.push("# Style Audit Report");
  lines.push("");
  lines.push(`Generated: ${now}  `);
  lines.push(`Schema: [${schema.$release}](${schema.$source})  `);
  lines.push(`Tiles: [${tiles.$release}](${tiles.$source})  `);
  lines.push(`Layers analyzed: ${layers.length}  `);
  lines.push("");

  // Style spec issues
  lines.push("## MapLibre Style Spec Validation");
  lines.push("");
  if (specIssues.length === 0) {
    lines.push("No style spec issues found.");
  } else {
    lines.push(`${specIssues.length} issue(s) found:`);
    lines.push("");
    lines.push("| Layer | Issue |");
    lines.push("|-------|-------|");
    for (const issue of specIssues) {
      lines.push(`| ${issue.layer || "(global)"} | ${issue.message} |`);
    }
  }
  lines.push("");

  // Schema + tile issues
  lines.push("## Schema & Tile Validation");
  lines.push("");
  if (issues.length === 0 && parseErrors.length === 0) {
    lines.push("No issues found.");
  } else {
    if (parseErrors.length > 0) {
      lines.push("### Parse Errors");
      lines.push("");
      for (const e of parseErrors) {
        lines.push(`- \`${e.file}\`: ${e.error}`);
      }
      lines.push("");
    }

    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warn");

    if (errors.length > 0) {
      lines.push("### Errors");
      lines.push("");
      lines.push("| File | Check | Issue |");
      lines.push("|------|-------|-------|");
      for (const i of errors) {
        lines.push(`| \`${i.file}\` | ${i.check} | ${i.message} |`);
      }
      lines.push("");
    }

    if (warnings.length > 0) {
      lines.push("### Warnings");
      lines.push("");
      lines.push("| File | Check | Issue |");
      lines.push("|------|-------|-------|");
      for (const i of warnings) {
        lines.push(`| \`${i.file}\` | ${i.check} | ${i.message} |`);
      }
      lines.push("");
    }
  }

  // Coverage
  lines.push("## Schema Coverage");
  lines.push("");
  let totalVals = 0;
  let totalStyled = 0;

  for (const entry of coverage) {
    lines.push(`### ${entry.theme}.${entry.type}`);
    lines.push("");
    for (const g of entry.groups) {
      const pct = Math.round((g.styled.length / g.total) * 100);
      totalVals += g.total;
      totalStyled += g.styled.length;
      lines.push(`**${g.label}**: ${g.styled.length} of ${g.total} (${pct}%)`);
      if (g.styled.length > 0)
        lines.push(`- styled: ${g.styled.map(s => `\`${s}\``).join(", ")}`);
      if (g.unstyled.length > 0)
        lines.push(`- unstyled: ${g.unstyled.map(s => `\`${s}\``).join(", ")}`);
      lines.push("");
    }
  }

  lines.push("### Summary");
  lines.push("");
  const totalPct = totalVals > 0 ? Math.round((totalStyled / totalVals) * 100) : 0;
  lines.push(`- **Total coverage**: ${totalStyled} of ${totalVals} schema values styled (${totalPct}%)`);
  lines.push(`- **Style spec issues**: ${specIssues.length}`);
  lines.push(`- **Schema/tile errors**: ${issues.filter((i) => i.severity === "error").length}`);
  lines.push(`- **Schema/tile warnings**: ${issues.filter((i) => i.severity === "warn").length}`);
  lines.push("");

  const md = lines.join("\n");
  fs.writeFileSync(REPORT_OUT, md);
  console.log(
    `Audit → ${path.relative(process.cwd(), REPORT_OUT)} (${specIssues.length} spec, ${issues.length} schema/tile issues)`
  );
}

// ── Run ──────────────────────────────────────────────

async function main() {
  console.log("dont-dream-its-overture\n");

  if (doBuildSchema) await buildSchema();
  if (doBuildTiles) await buildTiles();
  if (doValidateStyle) {
    if (!fs.existsSync(SCHEMA_OUT)) {
      console.log("schema.json not found — run with --build-schema first");
      process.exit(1);
    }
    if (!fs.existsSync(TILES_OUT)) {
      console.log("tiles.json not found — run with --build-tiles first");
      process.exit(1);
    }
    await validateStyle();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
