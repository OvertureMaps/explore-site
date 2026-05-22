/**
 * Tests for lib/layerHierarchy.js
 *
 * Verifies the hierarchy builder produces correctly structured output
 * from a minimal synthetic tree config, independent of the real
 * explore-tree.json contents.
 */

import { buildDownloadHierarchy } from "@/lib/layerHierarchy";

const SPECS = [
  { metadata: { "overture:item": "building",        "overture:type": "buildings" } },
  { metadata: { "overture:item": "building-part",   "overture:type": "buildings" } },
  { metadata: { "overture:item": "place",            "overture:type": "places"   } },
  { metadata: { "overture:item": "road",             "overture:type": "transportation" } },
];

const GROUPS = {
  buildings: {
    "buildings-main": {
      name: "Main",
      order: 1,
      items: {
        building:      { name: "Building",      order: 1 },
        "building-part": { name: "Building Part", order: 2 },
      },
    },
  },
  places: {
    "places-main": {
      name: "Places",
      order: 1,
      items: {
        place: { name: "Place", order: 1 },
      },
    },
  },
  transportation: {
    "roads": {
      name: "Roads",
      order: 1,
      items: {
        road: { name: "Road", order: 1 },
      },
    },
  },
};

const THEMES = {
  buildings:      { name: "Buildings",      order: 1 },
  places:         { name: "Places",         order: 2 },
  transportation: { name: "Transportation", order: 3 },
};

describe("buildDownloadHierarchy", () => {
  it("produces one entry per theme that has matching layer specs", () => {
    const h = buildDownloadHierarchy(SPECS, GROUPS, THEMES);
    expect(h.map((t) => t.key)).toEqual(["buildings", "places", "transportation"]);
  });

  it("sorts themes by the order field", () => {
    const shuffledThemes = { transportation: { name: "T", order: 3 }, buildings: { name: "B", order: 1 }, places: { name: "P", order: 2 } };
    const h = buildDownloadHierarchy(SPECS, GROUPS, shuffledThemes);
    expect(h.map((t) => t.key)).toEqual(["buildings", "places", "transportation"]);
  });

  it("attaches display names from treeThemes", () => {
    const h = buildDownloadHierarchy(SPECS, GROUPS, THEMES);
    expect(h.find((t) => t.key === "buildings").name).toBe("Buildings");
  });

  it("each item carries the correct source-layer type", () => {
    const h = buildDownloadHierarchy(SPECS, GROUPS, THEMES);
    const buildingItems = h.find((t) => t.key === "buildings").groups.flatMap((g) => g.items);
    expect(buildingItems.every((i) => i.type === "buildings")).toBe(true);
  });

  it("sorts items within a group by order", () => {
    const h = buildDownloadHierarchy(SPECS, GROUPS, THEMES);
    const items = h.find((t) => t.key === "buildings").groups[0].items;
    expect(items.map((i) => i.id)).toEqual(["building", "building-part"]);
  });

  it("excludes themes that have no matching specs", () => {
    const h = buildDownloadHierarchy([], GROUPS, THEMES);
    expect(h).toHaveLength(0);
  });

  it("excludes items with no matching spec", () => {
    const sparseGroups = {
      buildings: {
        "g": {
          name: "G", order: 1,
          items: {
            building: { name: "Building", order: 1 },
            "ghost-item": { name: "Ghost", order: 2 }, // no spec
          },
        },
      },
    };
    const h = buildDownloadHierarchy(SPECS, sparseGroups, { buildings: { name: "Buildings", order: 1 } });
    expect(h[0].groups[0].items.map((i) => i.id)).toEqual(["building"]);
  });

  it("returns empty array when treeGroups is empty", () => {
    expect(buildDownloadHierarchy(SPECS, {}, THEMES)).toHaveLength(0);
  });
});
