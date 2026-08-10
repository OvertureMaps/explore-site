/**
 * Tests for lib/normalizeGeojson.js
 *
 * Input is the Uint8Array writeGeoJSON produces; output is a GeoJSON string.
 */

import { strToU8 } from "fflate";
import { normalizeGeojson } from "@/lib/normalizeGeojson";

const encode = (features) =>
  strToU8(JSON.stringify({ type: "FeatureCollection", features }));

// A single-ring square, reused as the inner Polygon coordinates.
const ring = [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]];

describe("normalizeGeojson", () => {
  it("moves properties.id to the top-level Feature.id and removes it from properties", () => {
    const input = encode([
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [1, 2] },
        properties: { id: "abc123", name: "Somewhere" },
      },
    ]);

    const [feature] = JSON.parse(normalizeGeojson(input)).features;

    expect(feature.id).toBe("abc123");
    expect(feature.properties).toEqual({ name: "Somewhere" });
  });

  it("drops the Overture bbox spatial-index property", () => {
    const input = encode([
      {
        type: "Feature",
        geometry: { type: "Point", coordinates: [1, 2] },
        properties: {
          id: "abc123",
          name: "Somewhere",
          bbox: { xmin: 0, ymin: 0, xmax: 1, ymax: 1 },
        },
      },
    ]);

    const [feature] = JSON.parse(normalizeGeojson(input)).features;

    expect(feature.properties).toEqual({ name: "Somewhere" });
  });

  it("collapses a single-part MultiPolygon to a Polygon", () => {
    const input = encode([
      {
        type: "Feature",
        geometry: { type: "MultiPolygon", coordinates: [ring] },
        properties: { id: "one-part" },
      },
    ]);

    const [feature] = JSON.parse(normalizeGeojson(input)).features;

    expect(feature.geometry.type).toBe("Polygon");
    expect(feature.geometry.coordinates).toEqual(ring);
  });

  it("collapses a single-part MultiLineString to a LineString", () => {
    const line = [[0, 0], [1, 1], [2, 2]];
    const input = encode([
      {
        type: "Feature",
        geometry: { type: "MultiLineString", coordinates: [line] },
        properties: { id: "one-line" },
      },
    ]);

    const [feature] = JSON.parse(normalizeGeojson(input)).features;

    expect(feature.geometry.type).toBe("LineString");
    expect(feature.geometry.coordinates).toEqual(line);
  });

  it("collapses a single-part MultiPoint to a Point", () => {
    const input = encode([
      {
        type: "Feature",
        geometry: { type: "MultiPoint", coordinates: [[3, 4]] },
        properties: { id: "one-point" },
      },
    ]);

    const [feature] = JSON.parse(normalizeGeojson(input)).features;

    expect(feature.geometry.type).toBe("Point");
    expect(feature.geometry.coordinates).toEqual([3, 4]);
  });

  it("leaves multi-part geometries as multi-geometries", () => {
    const twoPolygons = [ring, [[[2, 2], [3, 2], [3, 3], [2, 2]]]];
    const twoLines = [[[0, 0], [1, 1]], [[2, 2], [3, 3]]];
    const input = encode([
      {
        type: "Feature",
        geometry: { type: "MultiPolygon", coordinates: twoPolygons },
        properties: { id: "two-polygons" },
      },
      {
        type: "Feature",
        geometry: { type: "MultiLineString", coordinates: twoLines },
        properties: { id: "two-lines" },
      },
    ]);

    const [poly, line] = JSON.parse(normalizeGeojson(input)).features;

    expect(poly.geometry.type).toBe("MultiPolygon");
    expect(poly.geometry.coordinates).toEqual(twoPolygons);
    expect(line.geometry.type).toBe("MultiLineString");
    expect(line.geometry.coordinates).toEqual(twoLines);
  });

  it("emits one feature per line", () => {
    const feature = (id) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: { id },
    });
    const input = encode([feature("a"), feature("b"), feature("c")]);

    const output = normalizeGeojson(input);

    // Three features -> the feature list spans three lines.
    const lines = output.split("\n");
    expect(lines).toHaveLength(5); // header, 3 features, footer
    expect(lines[1]).toContain('"a"');
    expect(lines[2]).toContain('"b"');
    expect(lines[3]).toContain('"c"');
    // Still valid GeoJSON.
    expect(JSON.parse(output).features).toHaveLength(3);
  });

  it("handles an empty FeatureCollection", () => {
    const result = normalizeGeojson(encode([]));
    expect(JSON.parse(result)).toEqual({ type: "FeatureCollection", features: [] });
  });
});
