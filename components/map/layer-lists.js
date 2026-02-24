// ---------------------------------------------------------------------------
// Layer lists — edit these arrays to control which layers appear
// ---------------------------------------------------------------------------

export const defaultLayers = [
  "layers/background.json",

  // Water
  "layers/base/water/ocean-fill.json",

  // Bathymetry (deepest first, shallowest on top)
  "layers/base/bathymetry/bathymetry-g7.json",
  "layers/base/bathymetry/bathymetry-g6.json",
  "layers/base/bathymetry/bathymetry-g5.json",
  "layers/base/bathymetry/bathymetry-g4.json",
  "layers/base/bathymetry/bathymetry-g3.json",
  "layers/base/bathymetry/bathymetry-g2.json",
  "layers/base/bathymetry/bathymetry-g1.json",
  "layers/base/bathymetry/bathymetry-g0.json",

  // Land
  "layers/base/land/land-fill.json",

  // Land Use
  "layers/base/land_use/land-use-park-fill.json",
  "layers/base/land_use/land-use-golf-fill.json",
  "layers/base/land_use/land-use-education-fill.json",
  "layers/base/land_use/land-use-medical-fill.json",
  "layers/base/land_use/land-use-military-fill.json",
  "layers/base/land_use/land-use-cemetery-fill.json",

  // Infrastructure
  "layers/base/infrastructure/infrastructure-airport-fill.json",
  "layers/base/infrastructure/infrastructure-pier-fill.json",
  "layers/base/infrastructure/infrastructure-pier-line.json",
  "layers/base/infrastructure/infrastructure-aerialway-fill.json",
  "layers/base/infrastructure/infrastructure-aerialway-line.json",

  // Water (non-ocean, over land)
  "layers/base/water/water-fill.json",
  "layers/base/water/water-fill-intermittent.json",
  "layers/base/water/water-line.json",
  "layers/base/water/water-line-intermittent.json",
  "layers/base/water/water-label.json",

  // Land Cover
  "layers/base/land_cover/land-cover-forest-fill.json",
  "layers/base/land_cover/land-cover-barren-fill.json",
  "layers/base/land_cover/land-cover-shrub-fill.json",
  "layers/base/land_cover/land-cover-grass-fill.json",
  "layers/base/land_cover/land-cover-crop-fill.json",
  "layers/base/land_cover/land-cover-wetland-fill.json",
  "layers/base/land_cover/land-cover-mangrove-fill.json",
  "layers/base/land_cover/land-cover-moss-fill.json",
  "layers/base/land_cover/land-cover-snow-fill.json",

  // Division boundaries
  "layers/divisions/country/country-boundary.json",
  "layers/divisions/country/country-boundary-maritime.json",
  "layers/divisions/region/region-boundary.json",
  "layers/divisions/region/region-boundary-maritime.json",
  "layers/divisions/county/county-boundary.json",
  "layers/divisions/county/county-boundary-maritime.json",
  "layers/divisions/other/other-boundary.json",
  "layers/divisions/other/other-boundary-maritime.json",

  // Transportation — overview (z4–12, single line for all features)
  "layers/transportation/segment-overview.json",

  // Transportation — road casings (outlines, minor first)
  "layers/transportation/segment-road-pedestrian-casing.json",
  "layers/transportation/segment-road-other-casing.json",
  "layers/transportation/segment-road-living-street-casing.json",
  "layers/transportation/segment-road-residential-casing.json",
  "layers/transportation/segment-road-tertiary-casing.json",
  "layers/transportation/segment-road-secondary-casing.json",
  "layers/transportation/segment-road-primary-casing.json",
  "layers/transportation/segment-road-trunk-casing.json",
  "layers/transportation/segment-road-motorway-casing.json",

  // Transportation — road fills (feature, minor first)
  "layers/transportation/segment-road-steps-line.json",
  "layers/transportation/segment-road-pedestrian-line.json",
  "layers/transportation/segment-road-other-line.json",
  "layers/transportation/segment-road-living-street-line.json",
  "layers/transportation/segment-road-residential-line.json",
  "layers/transportation/segment-road-tertiary-line.json",
  "layers/transportation/segment-road-secondary-line.json",
  "layers/transportation/segment-road-primary-line.json",
  "layers/transportation/segment-road-trunk-line.json",
  "layers/transportation/segment-road-motorway-line.json",

  // Buildings — footprints (flat fills)
  "layers/buildings/building-fill.json",
  "layers/buildings/building-part-fill.json",

  // Buildings — 3D extrusions
  "layers/buildings/building-extrusion.json",
  "layers/buildings/building-part-extrusion.json",

  // Transportation — rail
  "layers/transportation/segment-rail-line.json",
  "layers/transportation/segment-rail-ticks.json",

  // Transportation — waterways
  "layers/transportation/segment-water-line.json",

  // Places
  "layers/places/place-heat.json",
  "layers/places/place-circle.json",

  // Addresses
  "layers/addresses/address-label.json",

  // Places — categories
  "layers/places/park-symbol.json",
  "layers/places/airport-symbol.json",
  "layers/places/bar-symbol.json",
  "layers/places/grocery-symbol.json",
  "layers/places/hospital-symbol.json",
  "layers/places/fuel-symbol.json",
  "layers/places/golf-symbol.json",
  "layers/places/convenience-symbol.json",
  "layers/places/lodging-symbol.json",
  "layers/places/parking-symbol.json",
  "layers/places/rail-station-symbol.json",
  "layers/places/restaurant-symbol.json",
  "layers/places/shop-symbol.json",
  "layers/places/college-symbol.json",
  "layers/places/stadium-symbol.json",

  // Transportation labels
  "layers/transportation/segment-water-label.json",
  "layers/transportation/segment-road-other-label.json",
  "layers/transportation/segment-road-living-street-label.json",
  "layers/transportation/segment-road-residential-label.json",
  "layers/transportation/segment-road-tertiary-label.json",
  "layers/transportation/segment-road-secondary-label.json",
  "layers/transportation/segment-road-primary-label.json",
  "layers/transportation/segment-road-trunk-label.json",
  "layers/transportation/segment-road-motorway-label.json",
  "layers/transportation/segment-rail-label.json",

  // Division labels
  "layers/divisions/county/county-label.json",
  "layers/divisions/other/other-label.json",
  "layers/divisions/region/region-label.json",
  "layers/divisions/cities/city-label.json",
  "layers/divisions/country/country-label.json",
];

export const inspectLayers = [
  "layers/inspect/inspect-bathymetry-fill.json",
  "layers/inspect/inspect-water-fill.json",
  "layers/inspect/inspect-water-line.json",
  "layers/inspect/inspect-land-fill.json",
  "layers/inspect/inspect-land-line.json",
  "layers/inspect/inspect-land-cover-fill.json",
  "layers/inspect/inspect-land-use-fill.json",
  "layers/inspect/inspect-land-use-line.json",
  "layers/inspect/inspect-division-area-fill.json",
  "layers/inspect/inspect-building-fill.json",
  "layers/inspect/inspect-building-part-fill.json",
  "layers/inspect/inspect-segment-line.json",
  "layers/inspect/inspect-division-boundary-line.json",
  "layers/inspect/inspect-address-circle.json",
  "layers/inspect/inspect-place-circle.json",
  "layers/inspect/inspect-division-circle.json",
  // labels on top
  "layers/inspect/inspect-water-label.json",
  "layers/inspect/inspect-land-label.json",
  "layers/inspect/inspect-land-use-label.json",
  "layers/inspect/inspect-segment-label.json",
  "layers/inspect/inspect-address-label.json",
  "layers/inspect/inspect-place-label.json",
  "layers/inspect/inspect-division-label.json",
];
