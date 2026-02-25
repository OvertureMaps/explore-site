import {
  defaultLayerSpecs,
  inspectLayerSpecs,
} from "@/components/map";

// Build a mapping from source-layer type → set of item IDs.
// Used to determine inspect layer visibility from visible items.
const typeToItems = {};
for (const spec of [...defaultLayerSpecs, ...inspectLayerSpecs]) {
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
 * Given a pre-built layer spec and current runtime state, return a copy with
 * visibility applied based on the active layer tree items.
 *
 * visibleItems: array of item IDs (from overture:item metadata).
 */
function applyRuntimeStyle(spec, visibleItems) {
  const meta = spec.metadata || {};
  const item = meta["overture:item"];
  const type = meta["overture:type"];

  // Compute visibility:
  // - If spec has an item, check if that item is visible
  // - If no item, check if the type has any visible items
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
