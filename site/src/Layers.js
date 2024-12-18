export const layers = [
  {
    theme: "divisions",
    type: "division_area",
    polygon: true,
    line: true,
    color: "hsla(213, 23%, 92%, 1)",
    fillOutlineColor: "hsla(208, 15%, 78%, 1)",
    activeColor: "hsla(17, 17%, 92%, 1)",
    labelColor: "hsla(0, 0%, 0%, 0)",
  },
  {
    theme: "base",
    type: "land",
    polygon: true,
    point: true,
    line: true,
    color: "hsla(31, 100%, 90%, 0.33)",
    fillOutlineColor: "hsla(31, 100%, 90%)",
    activeColor: "hsla(30, 96%, 79%, 0.66)",
    labelColor: "hsla(28, 100%, 46%, 1)",
  },
  {
    theme: "base",
    type: "land_cover",
    polygon: true,
    color: [
      "match",
      ["get", "subtype"],
      //greens
      "moss",
      "hsla(98, 19%, 80%, 1)",
      "forest",
      "hsla(98, 39%, 80%, 1)",
      "grass",
      "hsla(98, 39%, 84%, 1)",
      "crop",
      "hsla(98, 39%, 88%, 1)",
      //browns
      "shrub",
      "hsla(80, 39%, 86%, 1)",
      "barren",
      "hsla(62, 39%, 84%, 1)",
      //teals
      "wetland",
      "hsla(194, 39%, 80%, 1)",
      "mangrove",
      "hsla(194, 39%, 84%, 1)",
      //grays
      "urban",
      "hsla(213, 19%, 89%, 1)",
      "snow",
      "hsla(100, 0%, 96%, 1)",
      "hsla(0, 0%, 0%, 0)",
    ],
    fillOutlineColor: "hsla(208, 15%, 78%, 0)",
    activeColor: "hsla(183, 76%, 30%, 0.25)",
    labelColor: "hsla(222, 49%, 91%, 0)",
  },
  {
    theme: "base",
    type: "land_use",
    polygon: true,
    activeOnly: true,
    minzoom: 13,
    color: "hsla(222, 49%, 91%, 1)",
    fillOutlineColor: "hsla(222, 49%, 81%, 1)",
    activeColor: "hsla(222, 49%, 91%, 1)",
    labelColor: "hsla(254, 100%, 66%, 1)",
  },
  {
    theme: "base",
    type: "land_use",
    point: true,
    line: true,
    outline: true,
    activeOnly: true,
    minzoom: 13,
    color: "hsla(222, 49%, 81%, 1)",
    activeColor: "hsla(222, 49%, 91%, 1)",
    labelColor: "hsla(254, 100%, 66%, 1)",
  },
  {
    theme: "base",
    type: "water",
    polygon: true,
    point: true,
    line: true,
    color: "hsla(195, 71%, 90%, 1)",
    fillOutlineColor: "hsla(195, 71%, 89%, 1)",
    activeColor: "hsla(195, 77%, 85%, 1)",
    labelColor: "hsla(209, 100%, 49%, 1)",
  },
  {
    theme: "base",
    type: "infrastructure",
    polygon: true,
    point: true,
    line: true,
    activeOnly: true,
    activeColor: "hsla(210, 15%, 65%, 0.25)",
    fillOutlineColor: "hsla(209, 13%, 52%, 0.5)",
    color: "hsla(209, 15%, 58%, 1)",
    labelColor: "hsla(207, 17%, 37%, 1)",
  },
  {
    theme: "transportation",
    type: "segment",
    line: true,
    color: "hsla(210, 16%, 82%, 0.4)",
    activeColor: "hsla(209, 100%, 72%, 0.5)",
    labelColor: "hsla(214, 100%, 40%, 1)",
  },
  {
    theme: "transportation",
    type: "connector",
    point: true,
    color: "hsla(210, 16%, 82%, 0.5)",
    activeColor: "hsla(209, 100%, 72%, 0.5)",
    labelColor: "hsla(214, 100%, 40%, 1)",
    pointSize: 5,
  },
  {
    theme: "buildings",
    type: "building",
    extrusion: true,
    color: "hsla(210, 16%, 82%, 0.2)",
    activeColor: "hsla(344, 100%, 66%, 0.4)",
    labelColor: "hsla(341, 91%, 32%, 1)",
  },
  {
    theme: "buildings",
    type: "building_part",
    extrusion: true,
    color: "hsla(210, 16%, 82%, 0.2)",
    activeColor: "hsla(344, 100%, 66%, 0.4)",
    labelColor: "hsla(341, 91%, 32%, 1)",
  },
  {
    theme: "places",
    type: "place",
    point: true,
    minzoom: 11,
    color: "hsla(226, 100%, 75%, 1)",
    activeColor: "hsla(243, 100%, 61%, 0.25)",
    labelColor: "hsla(249, 83%, 39%, 1)",
    pointSize: 5,
  },
  {
    theme: "addresses",
    type: "address",
    point: true,
    color: "hsla(210, 15%, 65%, 1)",
    activeColor: "hsla(43, 100%, 42%, 0.5)",
    labelColor: "hsla(43, 100%, 42%, 1)",
    pointSize: 5,
  },
  {
    theme: "divisions",
    type: "division_boundary",
    line: true,
    color: "hsla(210, 16%, 82%, 1)",
    activeColor: "hsla(210, 16%, 82%, 1)",
    labelColor: "hsla(201, 29%, 15%, 1)",
  },
];

export const themes = [...new Set(layers.map((layer) => layer.theme))];
