import {
  geometryLayers,
  labelLayers,
  divisionLabelSpec,
  allLayers,
} from "@/lib/map-styles";

const COLOR_PROPERTY = {
  circle: "circle-color",
  line: "line-color",
  fill: "fill-color",
  "fill-extrusion": "fill-extrusion-color",
};

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
 * dynamic paint/layout properties applied (color expressions, visibility,
 * opacity).
 */
function applyRuntimeStyle(spec, activeThemes, visibleTypes) {
  const meta = spec.metadata || {};
  const theme = meta["overture:theme"];
  const type = meta["overture:type"];
  const baseColor = meta["overture:color"];
  const activeColor = meta["overture:activeColor"];
  const activeOnly = meta["overture:activeOnly"];
  const pass = meta["overture:pass"];

  const active = activeThemes.includes(theme);

  // Compute display color and highlight color (same logic as original)
  const displayColor = active ? (activeColor || baseColor) : baseColor;
  const highlightColor = active
    ? activeColor ? baseColor : undefined
    : activeColor;

  // Compute visibility
  const visible =
    visibleTypes.includes(type) &&
    (!activeOnly || active);

  // Labels are only visible when the theme is active
  const layerVisible = pass === "labels" ? (visible && active) : visible;

  // Deep-clone the spec so we don't mutate the imported JSON
  const result = JSON.parse(JSON.stringify(spec));
  result.layout = result.layout || {};
  result.layout.visibility = layerVisible ? "visible" : "none";

  // Apply color expression for geometry layers that have overture:color
  const colorProp = COLOR_PROPERTY[spec.type];
  if (colorProp && baseColor && !spec.id.includes("click-buffer")) {
    result.paint[colorProp] = colorExpression(displayColor, highlightColor);
  }

  // Dynamic circle opacity
  if (spec.type === "circle" && baseColor) {
    result.paint["circle-opacity"] = active ? 1 : 0.4;
  }

  // Dynamic fill-extrusion opacity
  if (spec.type === "fill-extrusion" && baseColor) {
    result.paint["fill-extrusion-opacity"] = active
      ? activeThemes.length > 1 ? 0.35 : 0.15
      : 0.15;
  }

  // Dynamic outline width
  if (spec.id.includes("-outline") && !spec.id.includes("click-buffer")) {
    result.paint["line-width"] = [
      "interpolate", ["linear"], ["zoom"],
      12, 1,
      13, activeThemes.length > 1 ? 1 : 2,
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
 * Add all layers in correct order: geometry, labels, then division labels.
 */
export function addAllLayers(map, activeThemes, visibleTypes, mode) {
  // Geometry layers
  for (const spec of geometryLayers) {
    const styled = applyRuntimeStyle(spec, activeThemes, visibleTypes);
    if (!map.getLayer(styled.id)) {
      map.addLayer(styled);
    }
  }

  // Label layers
  for (const spec of labelLayers) {
    const styled = applyRuntimeStyle(spec, activeThemes, visibleTypes);
    if (!map.getLayer(styled.id)) {
      map.addLayer(styled);
    }
  }

  // Division labels (last)
  const divSpec = buildDivisionLabelSpec(mode);
  if (!map.getLayer(divSpec.id)) {
    map.addLayer(divSpec);
  }
}

/**
 * Update visibility and colors on all existing layers.
 */
export function updateLayerVisibility(map, activeThemes, visibleTypes) {
  for (const spec of [...geometryLayers, ...labelLayers]) {
    const styled = applyRuntimeStyle(spec, activeThemes, visibleTypes);
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
 * Build the division label spec with mode-dependent paint.
 */
export function buildDivisionLabelSpec(mode) {
  const spec = JSON.parse(JSON.stringify(divisionLabelSpec));
  spec.paint["text-color"] = mode === "theme-light" ? "hsla(201, 29%, 15%, 1)" : "white";
  spec.paint["text-halo-color"] = mode === "theme-light" ? "white" : "black";
  return spec;
}

/**
 * Update division label colors for dark/light mode.
 */
export function updateDivisionLabelMode(map, mode) {
  if (!map.getLayer("division-labels")) return;
  map.setPaintProperty(
    "division-labels",
    "text-color",
    mode === "theme-light" ? "hsla(201, 29%, 15%, 1)" : "white"
  );
  map.setPaintProperty(
    "division-labels",
    "text-halo-color",
    mode === "theme-light" ? "white" : "black"
  );
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
 * based on currently visible types.
 */
export function getInteractiveLayerIds(map, visibleTypes) {
  const styleLayers = map.getStyle().layers;
  return styleLayers
    .filter((layer) => visibleTypes.indexOf(layer["source-layer"]) >= 0)
    .map((layer) => layer.id);
}
