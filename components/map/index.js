import primitives from "./tokens/primitive-tokens.json";
import semantic from "./tokens/semantic-tokens.json";
import defaultMode from "./modes/default.json";
import globeOverrides from "./modes/globe.json";
import inspectOverrides from "./modes/inspect.json";

// --- Layer spec imports: base ---
import _base_bathymetry_outline from "./layers/base/bathymetry/bathymetry-outline.json";
import base_bathymetry_outline_click_buffer from "./layers/base/bathymetry/bathymetry-outline-click-buffer.json";
import _base_land_point from "./layers/base/land/land-point.json";
import _base_land_line from "./layers/base/land/land-line.json";
import base_land_line_click_buffer from "./layers/base/land/land-line-click-buffer.json";
import _base_land_fill from "./layers/base/land/land-fill.json";
import _base_land_cover_fill from "./layers/base/land_cover/land-cover-fill.json";
import _base_land_use_fill from "./layers/base/land_use/land-use-fill.json";
import _base_land_use_point from "./layers/base/land_use/land-use-point.json";
import _base_land_use_line from "./layers/base/land_use/land-use-line.json";
import base_land_use_line_click_buffer from "./layers/base/land_use/land-use-line-click-buffer.json";
import _base_land_use_outline from "./layers/base/land_use/land-use-outline.json";
import base_land_use_outline_click_buffer from "./layers/base/land_use/land-use-outline-click-buffer.json";
import _base_water_point from "./layers/base/water/water-point.json";
import _base_water_line from "./layers/base/water/water-line.json";
import base_water_line_click_buffer from "./layers/base/water/water-line-click-buffer.json";
import _base_water_fill from "./layers/base/water/water-fill.json";
import _base_infrastructure_point from "./layers/base/infrastructure/infrastructure-point.json";
import _base_infrastructure_line from "./layers/base/infrastructure/infrastructure-line.json";
import base_infrastructure_line_click_buffer from "./layers/base/infrastructure/infrastructure-line-click-buffer.json";
import _base_infrastructure_fill from "./layers/base/infrastructure/infrastructure-fill.json";

// --- Layer spec imports: divisions ---
import _divisions_division_area_line from "./layers/divisions/division_area/division-area-line.json";
import divisions_division_area_line_click_buffer from "./layers/divisions/division_area/division-area-line-click-buffer.json";
import _divisions_division_area_fill from "./layers/divisions/division_area/division-area-fill.json";
import _divisions_division_boundary_line from "./layers/divisions/division_boundary/division-boundary-line.json";
import divisions_division_boundary_line_click_buffer from "./layers/divisions/division_boundary/division-boundary-line-click-buffer.json";

// --- Layer spec imports: transportation ---
import _transportation_segment_line from "./layers/transportation/segment/segment-line.json";
import transportation_segment_line_click_buffer from "./layers/transportation/segment/segment-line-click-buffer.json";
import _transportation_connector_point from "./layers/transportation/connector/connector-point.json";

// --- Layer spec imports: buildings ---
import _buildings_building_fill_extrusion from "./layers/buildings/building/building-fill-extrusion.json";
import _buildings_building_part_fill_extrusion from "./layers/buildings/building_part/building-part-fill-extrusion.json";

// --- Layer spec imports: places ---
import _places_place_point from "./layers/places/place/place-point.json";

// --- Layer spec imports: addresses ---
import _addresses_address_point from "./layers/addresses/address/address-point.json";

// --- Label spec imports ---
import _divisions_division_area_line_label from "./layers/divisions/division_area/division-area-line-label.json";
import _divisions_division_area_fill_labels from "./layers/divisions/division_area/division-area-fill-labels.json";
import _base_bathymetry_fill_labels from "./layers/base/bathymetry/bathymetry-fill-labels.json";
import _base_land_point_label from "./layers/base/land/land-point-label.json";
import _base_land_line_label from "./layers/base/land/land-line-label.json";
import _base_land_fill_labels from "./layers/base/land/land-fill-labels.json";
import _base_land_cover_fill_labels from "./layers/base/land_cover/land-cover-fill-labels.json";
import _base_land_use_fill_labels from "./layers/base/land_use/land-use-fill-labels.json";
import _base_land_use_point_label from "./layers/base/land_use/land-use-point-label.json";
import _base_land_use_line_label from "./layers/base/land_use/land-use-line-label.json";
import _base_water_point_label from "./layers/base/water/water-point-label.json";
import _base_water_line_label from "./layers/base/water/water-line-label.json";
import _base_water_fill_labels from "./layers/base/water/water-fill-labels.json";
import _base_infrastructure_point_label from "./layers/base/infrastructure/infrastructure-point-label.json";
import _base_infrastructure_line_label from "./layers/base/infrastructure/infrastructure-line-label.json";
import _base_infrastructure_fill_labels from "./layers/base/infrastructure/infrastructure-fill-labels.json";
import _transportation_segment_line_label from "./layers/transportation/segment/segment-line-label.json";
import _transportation_connector_point_label from "./layers/transportation/connector/connector-point-label.json";
import _buildings_building_fill_labels from "./layers/buildings/building/building-fill-labels.json";
import _buildings_building_part_fill_labels from "./layers/buildings/building_part/building-part-fill-labels.json";
import _places_place_point_label from "./layers/places/place/place-point-label.json";
import _addresses_address_point_label from "./layers/addresses/address/address-point-label.json";
import _divisions_division_boundary_line_label from "./layers/divisions/division_boundary/division-boundary-line-label.json";
import _divisions_division_labels from "./layers/divisions/division/division-labels.json";

// ---------------------------------------------------------------------------
// Token resolution
// ---------------------------------------------------------------------------

/**
 * Resolve $-prefixed references in `obj` against one or more source objects.
 * Iterates until no more references can be resolved.
 *
 * Reference format: "$sourceKey.path.to.value"
 * Sources is a map like { primitives, semantic, ... }
 */
function resolveAgainst(obj, sources) {
  let json = JSON.stringify(obj);
  let prev;
  do {
    prev = json;
    json = json.replace(/"\$([^"]+)"/g, (match, path) => {
      const parts = path.split(".");
      const sourceKey = parts[0];
      const source = sources[sourceKey];
      if (!source) return match;
      let val = source;
      for (let i = 1; i < parts.length; i++) {
        val = val?.[parts[i]];
        if (val === undefined) return match;
      }
      return JSON.stringify(val);
    });
  } while (json !== prev);
  return JSON.parse(json);
}

/**
 * Deep-merge override onto base. Returns a new object.
 * Only merges plain objects; arrays and primitives are replaced.
 */
function deepMerge(base, override) {
  if (!override) return base;
  const result = { ...base };
  for (const key of Object.keys(override)) {
    if (
      result[key] &&
      typeof result[key] === "object" &&
      !Array.isArray(result[key]) &&
      typeof override[key] === "object" &&
      !Array.isArray(override[key])
    ) {
      result[key] = deepMerge(result[key], override[key]);
    } else {
      result[key] = override[key];
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Build resolved tokens
// ---------------------------------------------------------------------------

// Step 1: Resolve semantic tokens against primitives
const resolvedSemantic = resolveAgainst(semantic, { primitives });

// Step 2: Resolve each mode against primitives + semantic
const tokenSources = { primitives, semantic: resolvedSemantic };

const resolvedDefault = resolveAgainst(defaultMode, tokenSources);
const resolvedGlobeOverrides = resolveAgainst(globeOverrides, tokenSources);
const resolvedInspectOverrides = resolveAgainst(inspectOverrides, tokenSources);

// Step 3: Build final merged modes
export const modes = {
  default: resolvedDefault,
  globe: deepMerge(resolvedDefault, resolvedGlobeOverrides),
  inspect: deepMerge(resolvedDefault, resolvedInspectOverrides),
};

// ---------------------------------------------------------------------------
// Token access helpers
// ---------------------------------------------------------------------------

/**
 * Get the token data for a specific theme/type/mode combination.
 * Returns the layer type definition with resolved color values.
 */
export function getLayerTokens(theme, type, mode = "default") {
  const modeData = modes[mode] || modes.default;
  return modeData[theme]?.[type];
}

// ---------------------------------------------------------------------------
// Layer spec resolution
// ---------------------------------------------------------------------------

/**
 * Resolve $theme.type.* references in a layer spec against the default mode tokens.
 * Also resolves $primitives.* references for fonts etc.
 */
function resolveLayerSpec(spec) {
  const json = JSON.stringify(spec);
  const resolved = json.replace(/"\$([^"]+)"/g, (match, path) => {
    const parts = path.split(".");

    // $primitives.fonts.* references
    if (parts[0] === "primitives") {
      let val = primitives;
      for (let i = 1; i < parts.length; i++) {
        val = val?.[parts[i]];
        if (val === undefined) return match;
      }
      return JSON.stringify(val);
    }

    // $theme.type.property.subprop references (e.g. $base.land.color.fill)
    const theme = parts[0];
    const type = parts[1];
    const modeData = resolvedDefault;
    let val = modeData[theme]?.[type];
    if (!val) return match;
    for (let i = 2; i < parts.length; i++) {
      val = val?.[parts[i]];
      if (val === undefined) return match;
    }
    return JSON.stringify(val);
  });
  return JSON.parse(resolved);
}

// ---------------------------------------------------------------------------
// Resolve all layer specs
// ---------------------------------------------------------------------------

const r = resolveLayerSpec;

export const geometryLayers = [
  r(_divisions_division_area_line),
  divisions_division_area_line_click_buffer,
  r(_divisions_division_area_fill),
  r(_base_bathymetry_outline),
  base_bathymetry_outline_click_buffer,
  r(_base_land_point),
  r(_base_land_line),
  base_land_line_click_buffer,
  r(_base_land_fill),
  r(_base_land_cover_fill),
  r(_base_land_use_fill),
  r(_base_land_use_point),
  r(_base_land_use_line),
  base_land_use_line_click_buffer,
  r(_base_land_use_outline),
  base_land_use_outline_click_buffer,
  r(_base_water_point),
  r(_base_water_line),
  base_water_line_click_buffer,
  r(_base_water_fill),
  r(_base_infrastructure_point),
  r(_base_infrastructure_line),
  base_infrastructure_line_click_buffer,
  r(_base_infrastructure_fill),
  r(_transportation_segment_line),
  transportation_segment_line_click_buffer,
  r(_transportation_connector_point),
  r(_buildings_building_fill_extrusion),
  r(_buildings_building_part_fill_extrusion),
  r(_places_place_point),
  r(_addresses_address_point),
  r(_divisions_division_boundary_line),
  divisions_division_boundary_line_click_buffer,
];

export const labelLayers = [
  r(_divisions_division_area_line_label),
  r(_divisions_division_area_fill_labels),
  r(_base_bathymetry_fill_labels),
  r(_base_land_point_label),
  r(_base_land_line_label),
  r(_base_land_fill_labels),
  r(_base_land_cover_fill_labels),
  r(_base_land_use_fill_labels),
  r(_base_land_use_point_label),
  r(_base_land_use_line_label),
  r(_base_water_point_label),
  r(_base_water_line_label),
  r(_base_water_fill_labels),
  r(_base_infrastructure_point_label),
  r(_base_infrastructure_line_label),
  r(_base_infrastructure_fill_labels),
  r(_transportation_segment_line_label),
  r(_transportation_connector_point_label),
  r(_buildings_building_fill_labels),
  r(_buildings_building_part_fill_labels),
  r(_places_place_point_label),
  r(_addresses_address_point_label),
  r(_divisions_division_boundary_line_label),
  r(_divisions_division_labels),
];

export const allLayers = [...geometryLayers, ...labelLayers];
