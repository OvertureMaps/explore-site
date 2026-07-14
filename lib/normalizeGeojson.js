/**
 * Post-processing for the GeoJSON produced by `@geoarrow/geoarrow-wasm`'s
 * `writeGeoJSON`, to match the conventions of the source GeoParquet and the
 * overturemaps-py CLI:
 *
 *   - `id` is moved from `properties` up to the canonical top-level GeoJSON
 *     Feature.id member (RFC 7946 §3.2). writeGeoJSON emits every column,
 *     including `id`, as a property.
 *   - The `bbox` struct column is dropped. It's Overture's spatial index
 *     ({xmin, ymin, xmax, ymax}) used for row-group pruning during the query,
 *     not feature data; overturemaps-py drops it too.
 *   - Single-part multi-geometries are collapsed to their single form
 *     (MultiPolygon->Polygon, MultiLineString->LineString, MultiPoint->Point).
 *     geoarrow-wasm types each geometry column as one GeoArrow array, so a
 *     column mixing single- and multi-part geometries comes out entirely as the
 *     multi variant. Collapsing restores the plain geometry the source data
 *     uses; it's lossless — a one-part multi is the same shape.
 *
 * Input is the Uint8Array from writeGeoJSON; output is a GeoJSON string, which
 * buildZip accepts directly (so there's no re-encode). strFromU8 decodes the
 * bytes — the sibling zipDownload.js uses fflate the same way, and jsdom (our
 * test env) doesn't provide TextDecoder.
 *
 * @param {Uint8Array} geojsonBytes
 * @returns {string} the normalized GeoJSON
 */
import { strFromU8 } from "fflate";

// Each single-part multi-geometry collapses to its single form by peeling one
// level of coordinate nesting (coordinates[0]).
const SINGLE_FORM = {
  MultiPoint: "Point",
  MultiLineString: "LineString",
  MultiPolygon: "Polygon",
};

export function normalizeGeojson(geojsonBytes) {
  const collection = JSON.parse(strFromU8(geojsonBytes));
  for (const feature of collection.features) {
    feature.id = feature.properties.id;
    delete feature.properties.id;
    delete feature.properties.bbox;

    const geom = feature.geometry;
    if (geom && SINGLE_FORM[geom.type] && geom.coordinates.length === 1) {
      geom.type = SINGLE_FORM[geom.type];
      geom.coordinates = geom.coordinates[0];
    }
  }
  // Emit one feature per line, matching writeGeoJSON's original layout, rather
  // than the single line JSON.stringify(collection) would produce. Keeps the
  // file diff-friendly and streamable line-by-line.
  const features = collection.features.map((f) => JSON.stringify(f)).join(",\n");
  return `{ "type": "FeatureCollection", "features": [\n${features}\n] }`;
}
