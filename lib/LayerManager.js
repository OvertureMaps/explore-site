import {
  defaultLayerSpecs,
  inspectLayerSpecs,
  getLayerTokens,
  globals,
} from "@/components/map";

const COLOR_PROPERTY = {
  circle: "circle-color",
  line: "line-color",
  fill: "fill-color",
  "fill-extrusion": "fill-extrusion-color",
};

const LAYER_TYPE_TO_COLOR_KEY = {
  circle: "circle",
  line: "line",
  fill: "fill",
  "fill-extrusion": "fillExtrusion",
};

// Build a mapping from source-layer type → set of item IDs.
// Used to determine inspect layer visibility from visible items.
const typeToItems = {};
for (const spec of defaultLayerSpecs) {
  const meta = spec.metadata || {};
  const type = meta["overture:type"];
  const item = meta["overture:item"];
  if (type && item) {
    if (!typeToItems[type]) typeToItems[type] = new Set();
    typeToItems[type].add(item);
  }
}

/**
 * Check if a source-layer type has any visible items.
 */
export function isTypeVisible(type, visibleItems) {
  const items = typeToItems[type];
  if (!items) return false;
  for (const item of items) {
    if (visibleItems.includes(item)) return true;
  }
  return false;
}

/**
 * Convert visible items to visible source-layer type names.
 * Used by download/share features that need type-level granularity.
 */
export function getVisibleTypes(visibleItems) {
  const types = new Set();
  for (const [type, items] of Object.entries(typeToItems)) {
    for (const item of items) {
      if (visibleItems.includes(item)) {
        types.add(type);
        break;
      }
    }
  }
  return [...types];
}

/**
 * Get the display color for a layer spec from the token system.
 */
function getDisplayColor(spec) {
  const meta = spec.metadata || {};
  const theme = meta["overture:theme"];
  const type = meta["overture:type"];
  const colorKey = LAYER_TYPE_TO_COLOR_KEY[spec.type];
  if (!theme || !type || !colorKey) return null;

  const tokens = getLayerTokens(theme, type);
  if (!tokens) return null;

  return tokens.color?.[colorKey] ?? null;
}

function colorExpression(color, highlightColor) {
  return [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    highlightColor || "white",
    color,
  ];
}

/**
 * Given a pre-built layer spec and current runtime state, return a copy with
 * dynamic paint/layout properties applied (color expressions, visibility).
 *
 * visibleItems: array of item IDs (from overture:item metadata).
 */
function applyRuntimeStyle(spec, visibleItems) {
  const meta = spec.metadata || {};
  const item = meta["overture:item"];
  const type = meta["overture:type"];

  // Get colors from token system
  const baseColor = getDisplayColor(spec);

  // Selection color from globals
  const selectionColor = globals?.color?.selection;
  const highlightColor = selectionColor || "white";

  // Compute visibility:
  // - If spec has an item, check if that item is visible
  // - If no item (e.g. inspect layers), check if the type has any visible items
  // - If neither, always visible (e.g. background)
  let visible;
  if (item) {
    visible = visibleItems.includes(item);
  } else if (type) {
    visible = isTypeVisible(type, visibleItems);
  } else {
    visible = true;
  }

  // Deep-clone the spec so we don't mutate the imported JSON
  const result = JSON.parse(JSON.stringify(spec));
  result.layout = result.layout || {};
  result.paint = result.paint || {};
  result.layout.visibility = visible ? "visible" : "none";

  // Apply color expression for geometry layers that have a simple color token.
  // Skip when baseColor is an object (e.g. bathymetry {shallow, deep}) — the
  // layer spec already contains the correct expression with resolved tokens.
  const colorProp = COLOR_PROPERTY[spec.type];
  const isSimpleColor = typeof baseColor === "string" || Array.isArray(baseColor);
  if (colorProp && baseColor && isSimpleColor && !spec.id.includes("click-buffer") && meta["overture:selectable"] !== false) {
    // Use the spec's own resolved color when it differs from the token lookup
    // (e.g. maritime layers use color.maritime, not color.line).
    const specColor = spec.paint?.[colorProp];
    const effectiveColor = specColor || baseColor;
    result.paint[colorProp] = colorExpression(effectiveColor, highlightColor);
  }

  // Update fill-outline-color to match tokens (only if the spec doesn't
  // already have its own resolved value from a more specific token)
  if (spec.type === "fill" && !spec.id.includes("click-buffer")) {
    const tokens = getLayerTokens(meta["overture:theme"], meta["overture:type"]);
    const outlineColor = tokens?.color?.fillOutline;
    if (outlineColor && !spec.paint?.["fill-outline-color"]) {
      result.paint["fill-outline-color"] = outlineColor;
    }
  }

  // Update symbol layers — apply text colors (only if the spec doesn't already
  // have its own resolved values from more specific tokens)
  if (spec.type === "symbol") {
    const tokens = getLayerTokens(meta["overture:theme"], meta["overture:type"]);
    if (tokens?.color?.text && !spec.paint?.["text-color"]) {
      result.paint["text-color"] = tokens.color.text;
    }
    if (tokens?.color?.textHalo && !spec.paint?.["text-halo-color"]) {
      result.paint["text-halo-color"] = tokens.color.textHalo;
    }
  }

  // Dynamic circle opacity — always full
  if (spec.type === "circle" && baseColor) {
    result.paint["circle-opacity"] = 1;
  }

  // Dynamic fill-extrusion opacity (only if the spec doesn't already define it)
  if (spec.type === "fill-extrusion" && baseColor && !spec.paint?.["fill-extrusion-opacity"]) {
    result.paint["fill-extrusion-opacity"] = 0.15;
  }

  // Dynamic outline width
  if (spec.id.includes("-outline") && !spec.id.includes("click-buffer")) {
    result.paint["line-width"] = [
      "interpolate", ["linear"], ["zoom"],
      12, 1,
      13, 2,
    ];
  }

  return result;
}

/**
 * Add the 6 vector tile sources from PMTiles URLs.
 */
export function addSources(map, pmtilesUrls) {
  const sourceNames = ["base", "buildings", "places", "divisions", "transportation", "addresses"];
  for (const name of sourceNames) {
    if (pmtilesUrls[name] && !map.getSource(name)) {
      map.addSource(name, {
        type: "vector",
        url: `pmtiles://${pmtilesUrls[name]}`,
      });
    }
  }
}

/**
 * Add all default layers in the order defined by the layer list.
 * Also loads any required icon images.
 */
export async function addAllLayers(map, visibleItems) {
  // Load icons from SVGs — wait for all to load before adding layers
  const iconNames = ["star", "park", "airport", "beer", "grocery", "doctor", "fuel", "golf", "convenience", "lodging", "parking", "rail", "restaurant", "shop", "ranger-station", "stadium", "circle", "circle-stroked", "circle-opt"];

  await Promise.all(
    iconNames.map((name) => {
      if (map.hasImage(name)) return Promise.resolve();
      return new Promise((resolve) => {
        const img = new Image(25, 25);
        img.onload = () => {
          if (!map.hasImage(name)) {
            map.addImage(name, img);
          }
          resolve();
        };
        img.onerror = resolve;
        img.src = `/icons/${name}.svg`;
      });
    })
  );

  for (const spec of defaultLayerSpecs) {
    const styled = applyRuntimeStyle(spec, visibleItems);
    if (!map.getLayer(styled.id)) {
      map.addLayer(styled);
    }
  }
}

/**
 * Update visibility and colors on all existing layers.
 */
export function updateLayerVisibility(map, visibleItems) {
  for (const spec of defaultLayerSpecs) {
    const styled = applyRuntimeStyle(spec, visibleItems);
    if (!map.getLayer(styled.id)) continue;

    map.setLayoutProperty(styled.id, "visibility", styled.layout.visibility);

    // Update layout properties (e.g. text-font for symbol layers)
    if (styled.layout) {
      for (const [key, value] of Object.entries(styled.layout)) {
        if (key === "visibility") continue;
        map.setLayoutProperty(styled.id, key, value);
      }
    }

    if (styled.paint) {
      for (const [key, value] of Object.entries(styled.paint)) {
        map.setPaintProperty(styled.id, key, value);
      }
    }
  }
}

/**
 * Remove all default styled layers from the map.
 */
export function removeDefaultLayers(map) {
  for (const spec of defaultLayerSpecs) {
    if (map.getLayer(spec.id)) {
      map.removeLayer(spec.id);
    }
  }
}

/**
 * Add all inspect layers.
 */
export function addInspectLayers(map, visibleItems) {
  for (const spec of inspectLayerSpecs) {
    const styled = applyRuntimeStyle(spec, visibleItems);
    if (!map.getLayer(styled.id)) {
      map.addLayer(styled);
    }
  }
}

/**
 * Remove all inspect layers from the map.
 */
export function removeInspectLayers(map) {
  for (const spec of inspectLayerSpecs) {
    if (map.getLayer(spec.id)) {
      map.removeLayer(spec.id);
    }
  }
}

/**
 * Update visibility on inspect layers.
 */
export function updateInspectVisibility(map, visibleItems) {
  for (const spec of inspectLayerSpecs) {
    const styled = applyRuntimeStyle(spec, visibleItems);
    if (!map.getLayer(styled.id)) continue;

    map.setLayoutProperty(styled.id, "visibility", styled.layout.visibility);

    if (styled.paint) {
      for (const [key, value] of Object.entries(styled.paint)) {
        map.setPaintProperty(styled.id, key, value);
      }
    }
  }
}

/**
 * Highlight a feature by setting feature state. Clears previous feature state.
 */
export function highlightFeature(map, newFeature, prevFeature) {
  if (prevFeature) {
    map.removeFeatureState({
      source: prevFeature.source,
      sourceLayer: prevFeature.sourceLayer,
      id: prevFeature.id,
    });
  }

  if (newFeature) {
    map.setFeatureState(
      {
        source: newFeature.source,
        sourceLayer: newFeature.sourceLayer,
        id: newFeature.id,
      },
      { selected: true }
    );
  }
}

/**
 * Get the list of layer IDs that should be interactive (clickable),
 * based on currently visible items. Excludes layers marked as non-selectable.
 */
export function getInteractiveLayerIds(map, visibleItems) {
  const style = map.getStyle();
  if (!style || !style.layers) return [];
  return style.layers
    .filter((layer) => {
      const meta = layer.metadata;
      if (meta && meta["overture:selectable"] === false) return false;

      // Check by item if available, else by source-layer type
      const item = meta?.["overture:item"];
      if (item) {
        if (!visibleItems.includes(item)) return false;
      } else {
        const sourceLayer = layer["source-layer"];
        if (!sourceLayer || !isTypeVisible(sourceLayer, visibleItems)) return false;
      }

      return true;
    })
    .map((layer) => layer.id);
}
