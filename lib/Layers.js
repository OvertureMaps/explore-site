import { geometryLayers, labelLayers } from "@/lib/map-styles";

// Reconstruct abstract layer definitions from per-file metadata.
// Only geometry-pass specs define the layer entries (with theme, type, color,
// and geometry flags). Label-pass specs are ignored here since they don't
// carry the color/geometry info needed by the abstract definition.
const seen = new Map();

for (const spec of geometryLayers) {
  const meta = spec.metadata || {};
  const theme = meta["overture:theme"];
  const type = meta["overture:type"];

  // Click buffers are interaction helpers, not distinct layer definitions
  if (spec.id.includes("click-buffer")) continue;

  // Use color in the key to distinguish definitions that share theme+type
  // but have different colors (e.g. the two base/land_use entries).
  const key = `${theme}_${type}_${JSON.stringify(meta["overture:color"] || "")}`;

  if (!seen.has(key)) {
    seen.set(key, {
      theme,
      type,
      color: meta["overture:color"],
      activeColor: meta["overture:activeColor"],
      ...(meta["overture:activeOnly"] ? { activeOnly: true } : {}),
    });
  }

  const entry = seen.get(key);

  // Tag geometry flags based on MapLibre layer type
  if (spec.type === "circle") entry.point = true;
  if (spec.type === "line") {
    if (spec.id.includes("-outline")) entry.outline = true;
    else entry.line = true;
  }
  if (spec.type === "fill") entry.polygon = true;
  if (spec.type === "fill-extrusion") entry.extrusion = true;
}

export const layers = [...seen.values()];

export const themes = [...new Set(layers.map((layer) => layer.theme))];
