import { defaultLayerSpecs, getLayerTokens, globals } from "@/components/map";

// Reconstruct abstract layer definitions from per-file metadata.
// Only geometry-pass specs define the layer entries (with theme, type, color,
// and geometry flags). Label-pass specs are ignored here since they don't
// carry the color/geometry info needed by the abstract definition.
const seen = new Map();

for (const spec of defaultLayerSpecs) {
  const meta = spec.metadata || {};
  const theme = meta["overture:theme"];
  const type = meta["overture:type"];
  const item = meta["overture:item"];

  // Skip click buffers and label/symbol layers
  if (spec.id.includes("click-buffer")) continue;
  if (spec.type === "symbol") continue;

  // Get colors from the token system
  const tokens = getLayerTokens(theme, type);
  const color = tokens?.color?.fill || tokens?.color?.line || tokens?.color?.circle;
  const activeColor = globals?.color?.selection;

  // Use item as key to distinguish individually toggleable entries.
  const key = item || `${theme}_${type}_${spec.id}`;

  if (!seen.has(key)) {
    seen.set(key, {
      theme,
      type,
      item,
      color,
      activeColor,
    });
  }

  const entry = seen.get(key);

  // Tag geometry flags based on MapLibre layer type
  if (spec.type === "circle" || spec.type === "heatmap") entry.point = true;
  if (spec.type === "line") {
    if (spec.id.includes("-outline")) entry.outline = true;
    else entry.line = true;
  }
  if (spec.type === "fill") entry.polygon = true;
  if (spec.type === "fill-extrusion") entry.extrusion = true;
}

export const layers = [...seen.values()];
