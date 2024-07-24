export const layers = [
  {
    theme: "divisions",
    type: "division_area",
    polygon: true,
    color: "#e6e6e6",
  },
  {
    theme: "base",
    type: "land",
    polygon: true,
    point: true,
    line: true,
    color: "#e6eaef",
  },
  {
    theme: "base",
    type: "land_cover",
    polygon: true,
    color: [
      "match",
      ["get", "subtype"],
      "crop",
      "#eaedc9",
      "forest",
      "#b8e6b3",
      "shrub",
      "#f3f5e0",
      "moss",
      "#c9ede3",
      "wetland",
      "#d5f1e9",
      "urban",
      "#e3e3e3",
      "grass",
      "#f3f5e0",
      "barren",
      "#EFF0E7",
      "snow",
      "#ffffff",
      "#c3e9be",
    ],
  },
  {
    theme: "base",
    type: "land_use",
    polygon: true,
    activeOnly: true,
    minzoom: 13,
    color: "#CAD6DE",
  },
  {
    theme: "base",
    type: "land_use",
    point: true,
    line: true,
    outline: true,
    activeOnly: true,
    minzoom: 13,
    color: "#777",
  },
  {
    theme: "base",
    type: "water",
    polygon: true,
    point: true,
    line: true,
    color: "#bed9e9",
    activeColor: "#549bc4",
  },
  {
    theme: "base",
    type: "infrastructure",
    polygon: true,
    point: true,
    line: true,
    activeOnly: true,
    activeColor: "#8a70ff",
    color: "#c5b8ff",
  },
  {
    theme: "transportation",
    type: "segment",
    line: true,
    color: "#DECECA",
    activeColor: "#fa1937",
  },
  {
    theme: "transportation",
    type: "connector",
    point: true,
    color: "#DECECA",
    activeColor: "#fa1937",
    pointSize: 5,
  },
  {
    theme: "buildings",
    type: "building",
    extrusion: true,
    color: "#C0C3D8",
    activeColor: "#4359fe",
  },
  {
    theme: "buildings",
    type: "building_part",
    extrusion: true,
    color: "#C0C3D8",
    activeColor: "#4359fe",
  },
  {
    theme: "places",
    type: "place",
    point: true,
    color: "#fdcd96",
    activeColor: "#fb8804",
  },
  {
    theme: "addresses",
    type: "address",
    point: true,
    color: "#ffadf1",
    activeColor: "#ff1ad9",
    pointSize: 5,
  },
  {
    theme: "divisions",
    type: "boundary",
    line: true,
    color: "#CCC",
    activeColor: "#777",
  },
];

export const themes = [...new Set(layers.map((layer) => layer.theme))];
