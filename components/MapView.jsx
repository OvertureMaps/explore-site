import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";
import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import "@/components/CustomControls.css";
import SidePanel from "@/components/SidePanel";
import BookmarkDial from "@/components/BookmarkDial";
import FeaturePopup from "@/components/FeatureSelector";
import { loadPmtilesFromStac } from "@/lib/stacService";
import { getInspectTokens } from "@/components/map";
import {
  addSources,
  addAllLayers,
  updateLayerVisibility,
  highlightFeature,
  getInteractiveLayerIds,
  isTypeVisible,
  removeDefaultLayers,
  addInspectLayers,
  removeInspectLayers,
  updateInspectVisibility,
} from "@/lib/LayerManager";

// Set RTL text plugin for Arabic/Hebrew rendering (must be called once, before map init)
try {
  maplibregl.setRTLTextPlugin(
    "https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.2.3/mapbox-gl-rtl-text.js",
    null,
    true
  );
} catch {
  // Already set — ignore
}

// Load PMTiles URLs from STAC catalog at module load time
const pmtilesPromise = loadPmtilesFromStac();

const INITIAL_CENTER = [-98.58, 39.83];
const INITIAL_ZOOM = 2;

// Build a flat lookup from source-layer name to inspectColor
const INSPECT_COLORS = {};
for (const theme of ["base", "buildings", "transportation", "addresses", "places", "divisions"]) {
  const inspectTheme = {
    base: ["land", "water", "bathymetry", "land_cover", "land_use"],
    buildings: ["building", "building_part"],
    transportation: ["segment"],
    addresses: ["address"],
    places: ["place"],
    divisions: ["division", "division_area", "division_boundary"],
  }[theme] || [];
  for (const type of inspectTheme) {
    const tokens = getInspectTokens(theme, type);
    const inspectColor = tokens?.color?.fill || tokens?.color?.line || tokens?.color?.circle || tokens?.color?.text;
    if (inspectColor && typeof inspectColor === "string") {
      INSPECT_COLORS[type] = inspectColor;
    }
  }
}

// this reference must remain constant to avoid re-renders
const MAP_STYLE = {
  version: 8,
  glyphs: "/fonts/{fontstack}/{range}.pbf",
  sources: {},
  layers: [],
  projection: { type: "globe" },
  light: { anchor: "viewport", color: "white", intensity: 0.1 },
};

export default function Map({
  mode,
  language,
  features,
  setFeatures,
  activeFeature,
  setActiveFeature,
  zoom,
  setZoom,
  visibleTypes,
  setVisibleTypes,
  defaultVisibleTypes,
  onMapReady,
  inspectMode,
  globeMode,
  pendingFeature,
  setPendingFeature,
  initialPosition,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pmtilesUrls, setPmtilesUrls] = useState({});
  const [sourcesAdded, setSourcesAdded] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("layers");

  const [lastClickedCoords, setLastClickedCoords] = useState();

  const visibleTypesRef = useRef(visibleTypes);
  useEffect(() => {
    visibleTypesRef.current = visibleTypes;
  }, [visibleTypes]);

  const activeFeatureRef = useRef(null);
  const inspectActiveRef = useRef(false);

  // Load PMTiles URLs from STAC catalog
  useEffect(() => {
    pmtilesPromise
      .then((urls) => {
        const urlsObj = Object.fromEntries(urls);
        setPmtilesUrls(urlsObj);
      })
      .catch((error) => {
        console.error("Failed to load PMTiles from STAC catalog:", error);
      });
  }, []);

  // Initialize map
  useEffect(() => {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: initialPosition?.center || INITIAL_CENTER,
      zoom: initialPosition?.zoom || INITIAL_ZOOM,
      bearing: 0,
      pitch: 0,
      hash: true,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl(), "top-right");
    map.addControl(new maplibregl.GeolocateControl(), "top-right");
    map.addControl(new maplibregl.ScaleControl(), "bottom-left");
    map.addControl(
      new maplibregl.AttributionControl({
        customAttribution:
          '<a href="https://openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>, <a href="https://overturemaps.org" target="_blank">Overture Maps Foundation</a>',
      })
    );

    map.on("load", () => {
      setMapLoaded(true);

      const container = mapContainer.current;
      const zoomIn = container.querySelector(".maplibregl-ctrl-zoom-in");
      const zoomOut = container.querySelector(".maplibregl-ctrl-zoom-out");
      const compass = container.querySelector(".maplibregl-ctrl-compass");
      const geolocate = container.querySelector(".maplibregl-ctrl-geolocate");
      if (zoomIn) zoomIn.title = "Zoom in";
      if (zoomOut) zoomOut.title = "Zoom out";
      if (compass) {
        compass.title = "Reset rotation";
        const newCompass = compass.cloneNode(true);
        compass.parentNode.replaceChild(newCompass, compass);
        newCompass.addEventListener("click", () => {
          map.easeTo({ bearing: 0, pitch: 0 });
        });
      }
      if (geolocate) geolocate.title = "Find my location";
    });

    map.on("zoom", () => {
      setZoom(map.getZoom());
    });

    // Click handler
    map.on("click", (e) => {
      const currentVisibleTypes = visibleTypesRef.current;
      const interactiveIds = getInteractiveLayerIds(map, currentVisibleTypes);

      const queriedFeatures = interactiveIds.length > 0
        ? map.queryRenderedFeatures(e.point, { layers: interactiveIds })
        : [];


      const coords = {
        longitude: e.lngLat.lng,
        latitude: e.lngLat.lat,
      };

      setLastClickedCoords(coords);

      const clickedFeatures = [];
      const seenIds = new Set();

      for (const feature of queriedFeatures) {
        if (isTypeVisible(feature.layer["source-layer"], currentVisibleTypes)) {
          if (!seenIds.has(feature.properties.id)) {
            clickedFeatures.push(feature);
            seenIds.add(feature.properties.id);
          }
        }
      }

      if (clickedFeatures.length > 0) {
        setFeatures(clickedFeatures);
        setActiveFeature(clickedFeatures[0]);
        // Auto-switch to Features tab and open drawer
        setActiveTab("features");
        setDrawerOpen(true);
      } else {
        setFeatures([]);
        setActiveFeature(null);
      }
    });

    // Cursor handler
    map.on("mousemove", (e) => {
      const currentVisibleTypes = visibleTypesRef.current;
      const interactiveIds = getInteractiveLayerIds(map, currentVisibleTypes);

      if (interactiveIds.length === 0) {
        map.getCanvas().style.cursor = "auto";
        return;
      }

      const featuresAtPoint = map.queryRenderedFeatures(e.point, {
        layers: interactiveIds,
      });

      map.getCanvas().style.cursor =
        featuresAtPoint.some(
          (f) => isTypeVisible(f.layer["source-layer"], currentVisibleTypes)
        )
          ? "pointer"
          : "auto";
    });

    mapRef.current = map;
    window.map = map;
    if (onMapReady) onMapReady(map);

    return () => {
      map.remove();
      maplibregl.removeProtocol("pmtiles");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add sources and layers when map is loaded and PMTiles URLs are ready
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || Object.keys(pmtilesUrls).length === 0) return;

    const map = mapRef.current;
    addSources(map, pmtilesUrls);
    addAllLayers(map, visibleTypes).then(() => setSourcesAdded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, pmtilesUrls]);

  // Update layer visibility when visibleTypes change
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
    if (inspectActiveRef.current) {
      updateInspectVisibility(mapRef.current, visibleTypes);
    } else {
      updateLayerVisibility(mapRef.current, visibleTypes);
    }
  }, [visibleTypes, sourcesAdded]);

  // Update map language on symbol layers
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
    if (inspectActiveRef.current) return;
    const map = mapRef.current;
    const style = map.getStyle();
    if (!style) return;
    for (const layer of style.layers) {
      if (layer.type !== "symbol") continue;
      if (!layer.layout?.["text-field"]) continue;
      if (language === "mul") {
        map.setLayoutProperty(layer.id, "text-field", ["get", "@name"]);
        continue;
      }
      map.setLayoutProperty(layer.id, "text-field", [
        "let",
        "names_str",
        ["to-string", ["get", "names"]],
        "key",
        ["concat", '"', language, '":"'],
        [
          "let",
          "idx",
          ["index-of", ["var", "key"], ["var", "names_str"]],
          [
            "case",
            [">=", ["var", "idx"], 0],
            [
              "let",
              "start",
              ["+", ["var", "idx"], ["length", ["var", "key"]]],
              [
                "slice",
                ["var", "names_str"],
                ["var", "start"],
                [
                  "index-of",
                  '"',
                  ["var", "names_str"],
                  ["var", "start"],
                ],
              ],
            ],
            ["get", "@name"],
          ],
        ],
      ]);
    }
  }, [language, sourcesAdded]);

  // Highlight active feature
  useEffect(() => {
    if (!mapRef.current) return;

    highlightFeature(mapRef.current, activeFeature, activeFeatureRef.current);
    activeFeatureRef.current = activeFeature;
  }, [activeFeature]);

  // Restore a pending feature from URL params once tiles are loaded
  useEffect(() => {
    if (!pendingFeature || !sourcesAdded || !mapRef.current) return;
    const map = mapRef.current;
    const { gersId } = pendingFeature;

    const SOURCE_LAYER_COMBOS = [
      { source: "base", sourceLayers: ["land_cover", "land_use", "water", "land", "infrastructure", "bathymetry"] },
      { source: "buildings", sourceLayers: ["building", "building_part"] },
      { source: "places", sourceLayers: ["place"] },
      { source: "divisions", sourceLayers: ["division", "division_area", "division_boundary"] },
      { source: "transportation", sourceLayers: ["segment", "connector"] },
      { source: "addresses", sourceLayers: ["address"] },
    ];

    function tryFind() {
      if (pendingFeature.searchAll) {
        for (const { source, sourceLayers } of SOURCE_LAYER_COMBOS) {
          if (!map.getSource(source)) continue;
          for (const sl of sourceLayers) {
            const results = map.querySourceFeatures(source, {
              sourceLayer: sl,
              filter: ["==", ["get", "id"], gersId],
            });
            if (results.length > 0) {
              const match = results[0];
              match.source = source;
              match.sourceLayer = sl;
              return match;
            }
          }
        }
        return null;
      }
      // Single source/sourceLayer lookup (URL restore path)
      const { source, sourceLayer } = pendingFeature;
      const results = map.querySourceFeatures(source, {
        sourceLayer,
        filter: ["==", ["get", "id"], gersId],
      });
      if (results.length === 0) return null;
      const match = results[0];
      match.source = source;
      match.sourceLayer = sourceLayer;
      return match;
    }

    function resolve(match) {
      setActiveFeature(match);
      setFeatures([match]);
      setActiveTab("features");
      setDrawerOpen(true);
      setPendingFeature(null);
    }

    // Retry on idle events — fires after each render frame completes,
    // so tiles will be loaded and features queryable.
    const timeout = setTimeout(() => {
      map.off("idle", onIdle);
      setPendingFeature(null);
    }, 10000);

    function onIdle() {
      const match = tryFind();
      if (match) {
        clearTimeout(timeout);
        map.off("idle", onIdle);
        resolve(match);
      }
    }

    map.on("idle", onIdle);

    return () => {
      clearTimeout(timeout);
      map.off("idle", onIdle);
    };
  }, [pendingFeature, sourcesAdded, setPendingFeature, setActiveFeature, setFeatures]);

  // Keep window.map in sync
  useEffect(() => {
    window.map = mapRef.current;
  });

  // Sync inspect mode — swap between styled layers and inspect layers
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
    const map = mapRef.current;

    if (inspectMode && !inspectActiveRef.current) {
      // Entering inspect mode: remove styled layers, add inspect layers
      removeDefaultLayers(map);
      addInspectLayers(map, visibleTypesRef.current);
      inspectActiveRef.current = true;
    } else if (!inspectMode && inspectActiveRef.current) {
      // Leaving inspect mode: remove inspect layers, add styled layers
      inspectActiveRef.current = false;
      removeInspectLayers(map);
      addAllLayers(map, visibleTypesRef.current).then(() => {
        // Visibility types may have been swapped by the parent after this
        // effect fired — re-apply with the latest ref value.
        updateLayerVisibility(map, visibleTypesRef.current);
      });
    }
  }, [inspectMode, sourcesAdded]);

  // Toggle globe/mercator projection
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setProjection({
      type: globeMode ? "globe" : "mercator",
    });
  }, [globeMode, mapLoaded]);

  // Resize map when drawer opens/closes so it fills the remaining space
  useEffect(() => {
    if (!mapRef.current) return;
    // Wait for the CSS transition to finish before resizing
    const timer = setTimeout(() => {
      mapRef.current?.resize();
    }, 250);
    return () => clearTimeout(timer);
  }, [drawerOpen]);

  return (
    <>
      <div className={`map ${mode} tour-map`}>
        <div
          ref={mapContainer}
          style={{
            position: "fixed",
            top: 60,
            left: drawerOpen ? 340 : 0,
            width: drawerOpen ? "calc(100% - 340px)" : "100%",
            height: "calc(100vh - 60px)",
            transition: "left 225ms cubic-bezier(0,0,0.2,1), width 225ms cubic-bezier(0,0,0.2,1)",
          }}
        />

        <FeaturePopup
          map={mapRef.current}
          coordinates={lastClickedCoords}
          features={features}
          onClose={() => setLastClickedCoords(null)}
          setActiveFeature={setActiveFeature}
          activeFeature={activeFeature}
        />

        <div className="custom-controls">
          <BookmarkDial mode={mode} />
        </div>

        <SidePanel
          mode={mode}
          drawerOpen={drawerOpen}
          setDrawerOpen={setDrawerOpen}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          visibleTypes={visibleTypes}
          setVisibleTypes={setVisibleTypes}
          defaultVisibleTypes={defaultVisibleTypes}
          inspectMode={inspectMode}
          zoom={zoom}
          features={features}
          setFeatures={setFeatures}
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
        />
      </div>
    </>
  );
}

Map.propTypes = {
  mode: PropTypes.string.isRequired,
  language: PropTypes.string.isRequired,
  features: PropTypes.array.isRequired,
  setFeatures: PropTypes.func.isRequired,
  activeFeature: PropTypes.object,
  setActiveFeature: PropTypes.func.isRequired,
  zoom: PropTypes.number.isRequired,
  setZoom: PropTypes.func.isRequired,
  visibleTypes: PropTypes.array.isRequired,
  setVisibleTypes: PropTypes.func.isRequired,
  onMapReady: PropTypes.func,
  inspectMode: PropTypes.bool.isRequired,
  globeMode: PropTypes.bool.isRequired,
  pendingFeature: PropTypes.object,
  setPendingFeature: PropTypes.func.isRequired,
  initialPosition: PropTypes.object,
};
