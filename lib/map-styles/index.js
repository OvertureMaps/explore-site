import vars from "./variables.json";

import _divisions_division_area_line from "./divisions/division-area-line.json";
import divisions_division_area_line_click_buffer from "./divisions/division-area-line-click-buffer.json";
import _divisions_division_area_fill from "./divisions/division-area-fill.json";
import _base_bathymetry_outline from "./base/bathymetry-outline.json";
import base_bathymetry_outline_click_buffer from "./base/bathymetry-outline-click-buffer.json";
import _base_land_point from "./base/land-point.json";
import _base_land_line from "./base/land-line.json";
import base_land_line_click_buffer from "./base/land-line-click-buffer.json";
import _base_land_fill from "./base/land-fill.json";
import _base_land_cover_fill from "./base/land-cover-fill.json";
import _base_land_use_fill from "./base/land-use-fill.json";
import _base_land_use_point from "./base/land-use-point.json";
import _base_land_use_line from "./base/land-use-line.json";
import base_land_use_line_click_buffer from "./base/land-use-line-click-buffer.json";
import _base_land_use_outline from "./base/land-use-outline.json";
import base_land_use_outline_click_buffer from "./base/land-use-outline-click-buffer.json";
import _base_water_point from "./base/water-point.json";
import _base_water_line from "./base/water-line.json";
import base_water_line_click_buffer from "./base/water-line-click-buffer.json";
import _base_water_fill from "./base/water-fill.json";
import _base_infrastructure_point from "./base/infrastructure-point.json";
import _base_infrastructure_line from "./base/infrastructure-line.json";
import base_infrastructure_line_click_buffer from "./base/infrastructure-line-click-buffer.json";
import _base_infrastructure_fill from "./base/infrastructure-fill.json";
import _transportation_segment_line from "./transportation/segment-line.json";
import transportation_segment_line_click_buffer from "./transportation/segment-line-click-buffer.json";
import _transportation_connector_point from "./transportation/connector-point.json";
import _buildings_building_fill_extrusion from "./buildings/building-fill-extrusion.json";
import _buildings_building_part_fill_extrusion from "./buildings/building-part-fill-extrusion.json";
import _places_place_point from "./places/place-point.json";
import _addresses_address_point from "./addresses/address-point.json";
import _divisions_division_boundary_line from "./divisions/division-boundary-line.json";
import divisions_division_boundary_line_click_buffer from "./divisions/division-boundary-line-click-buffer.json";
import _divisions_division_area_line_label from "./divisions/division-area-line-label.json";
import _divisions_division_area_fill_labels from "./divisions/division-area-fill-labels.json";
import _base_bathymetry_fill_labels from "./base/bathymetry-fill-labels.json";
import _base_land_point_label from "./base/land-point-label.json";
import _base_land_line_label from "./base/land-line-label.json";
import _base_land_fill_labels from "./base/land-fill-labels.json";
import _base_land_cover_fill_labels from "./base/land-cover-fill-labels.json";
import _base_land_use_fill_labels from "./base/land-use-fill-labels.json";
import _base_land_use_point_label from "./base/land-use-point-label.json";
import _base_land_use_line_label from "./base/land-use-line-label.json";
import _base_water_point_label from "./base/water-point-label.json";
import _base_water_line_label from "./base/water-line-label.json";
import _base_water_fill_labels from "./base/water-fill-labels.json";
import _base_infrastructure_point_label from "./base/infrastructure-point-label.json";
import _base_infrastructure_line_label from "./base/infrastructure-line-label.json";
import _base_infrastructure_fill_labels from "./base/infrastructure-fill-labels.json";
import _transportation_segment_line_label from "./transportation/segment-line-label.json";
import _transportation_connector_point_label from "./transportation/connector-point-label.json";
import _buildings_building_fill_labels from "./buildings/building-fill-labels.json";
import _buildings_building_part_fill_labels from "./buildings/building-part-fill-labels.json";
import _places_place_point_label from "./places/place-point-label.json";
import _addresses_address_point_label from "./addresses/address-point-label.json";
import _divisions_division_boundary_line_label from "./divisions/division-boundary-line-label.json";
import _divisions_division_labels from "./divisions/division-labels.json";

/**
 * Resolve $theme.type.property references in a layer spec against variables.json.
 * Deep-clones the spec and replaces any string value matching "$theme.type.prop" with the
 * corresponding value from vars[theme][type][prop].
 */
function resolveColors(spec) {
  const json = JSON.stringify(spec);
  const resolved = json.replace(/"\$([^".]+)\.([^".]+)\.([^"]+)"/g, (match, theme, type, prop) => {
    const val = vars[theme]?.[type]?.[prop];
    if (val === undefined) return match;
    return JSON.stringify(val);
  });
  return JSON.parse(resolved);
}

// Resolve all layers that contain variable references.
// Click buffers have no variables and pass through as-is.
const r = resolveColors;

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
];

export const divisionLabelSpec = r(_divisions_division_labels);

export const allLayers = [...geometryLayers, ...labelLayers, divisionLabelSpec];
