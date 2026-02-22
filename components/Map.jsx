import "maplibre-gl/dist/maplibre-gl.css";
import "@maplibre/maplibre-gl-inspect/dist/maplibre-gl-inspect.css";
import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";
import MaplibreInspect from "@maplibre/maplibre-gl-inspect";
import { useState, useEffect, useRef } from "react";
import InspectorPanel from "@/components/inspector_panel/InspectorPanel";
import PropTypes from "prop-types";
import "@/components/CustomControls.css";
import ThemeSelector from "@/components/ThemeSelector";
import Navigator from "@/components/navigator/Navigator";
import FeaturePopup from "@/components/FeatureSelector";
import { loadPmtilesFromStac } from "@/lib/stacService";
import variables from "@/lib/map-styles/variables.json";
import {
  addSources,
  addAllLayers,
  updateLayerVisibility,
  updateDivisionLabelMode,
  highlightFeature,
  getInteractiveLayerIds,
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

const INITIAL_CENTER = [-77.036495, 38.90678];
const INITIAL_ZOOM = 15;

// Build a flat lookup from source-layer name to inspectColor
const INSPECT_COLORS = {};
for (const theme of Object.keys(variables)) {
  if (theme === "global") continue;
  for (const [layerName, props] of Object.entries(variables[theme])) {
    if (props.inspectColor) {
      INSPECT_COLORS[layerName] = props.inspectColor;
    }
  }
}

// this reference must remain constant to avoid re-renders
const MAP_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {},
  layers: [],
  projection: { type: "globe" },
};

export default function Map({
  mode,
  language,
  features,
  setFeatures,
  activeFeature,
  setActiveFeature,
  setZoom,
  navigatorOpen,
  setNavigatorOpen,
  themeRef,
  visibleTypes,
  setVisibleTypes,
  onMapReady,
  inspectMode,
  globeMode,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const inspectRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pmtilesUrls, setPmtilesUrls] = useState({});
  const [sourcesAdded, setSourcesAdded] = useState(false);

  const [activeThemes, setActiveThemes] = useState([
    "places",
    "addresses",
    "buildings",
    "transportation",
  ]);

  const [lastClickedCoords, setLastClickedCoords] = useState();

  // Refs for latest state to avoid stale closures in map event handlers
  const activeThemesRef = useRef(activeThemes);
  useEffect(() => {
    activeThemesRef.current = activeThemes;
  }, [activeThemes]);

  const visibleTypesRef = useRef(visibleTypes);
  useEffect(() => {
    visibleTypesRef.current = visibleTypes;
  }, [visibleTypes]);

  const activeFeatureRef = useRef(null);

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
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
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

    const inspect = new MaplibreInspect({
      showInspectButton: false,
      showInspectMapPopupOnHover: false,
      showMapPopupOnHover: false,
      popup: new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
      }),
      sources: {
        base: ["bathymetry", "land", "land_cover", "land_use", "water", "infrastructure"],
        buildings: ["building", "building_part"],
        places: ["place"],
        divisions: ["division_area", "division_boundary", "division"],
        transportation: ["segment", "connector"],
        addresses: ["address"],
      },
      assignLayerColor: (layerId) => {
        // Match layer ID to source-layer by finding the longest matching prefix
        // Layer IDs follow the pattern: {source_layer}-{suffix} with underscores replaced by hyphens
        const normalized = layerId.replace(/-/g, "_");
        let match = "";
        for (const sourceLayer of Object.keys(INSPECT_COLORS)) {
          if (normalized.startsWith(sourceLayer) && sourceLayer.length > match.length) {
            match = sourceLayer;
          }
        }
        return match ? INSPECT_COLORS[match] : "hsla(0, 0%, 50%, 0.5)";
      },
    });
    map.addControl(inspect);
    inspectRef.current = inspect;

    map.on("load", () => {
      setMapLoaded(true);

      // Add tooltips to map control buttons
      const container = mapContainer.current;
      const zoomIn = container.querySelector(".maplibregl-ctrl-zoom-in");
      const zoomOut = container.querySelector(".maplibregl-ctrl-zoom-out");
      const compass = container.querySelector(".maplibregl-ctrl-compass");
      const geolocate = container.querySelector(".maplibregl-ctrl-geolocate");
      if (zoomIn) zoomIn.title = "Zoom in";
      if (zoomOut) zoomOut.title = "Zoom out";
      if (compass) compass.title = "Reset rotation";
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
        if (currentVisibleTypes.indexOf(feature.layer["source-layer"]) >= 0) {
          if (!seenIds.has(feature.properties.id)) {
            clickedFeatures.push(feature);
            seenIds.add(feature.properties.id);
          }
        }
      }

      if (clickedFeatures.length > 0) {
        setFeatures(clickedFeatures);
        setActiveFeature(clickedFeatures[0]);
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
          (f) => currentVisibleTypes.indexOf(f.layer["source-layer"]) >= 0
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
    addAllLayers(map, activeThemes, visibleTypes, mode);
    setSourcesAdded(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, pmtilesUrls]);

  // Update layer visibility when visibleTypes or activeThemes change
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
    if (inspectRef.current?._showInspectMap) return;
    updateLayerVisibility(mapRef.current, activeThemes, visibleTypes);
  }, [visibleTypes, activeThemes, sourcesAdded]);

  // Update division label colors on mode change
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
    if (inspectRef.current?._showInspectMap) return;
    updateDivisionLabelMode(mapRef.current, mode);
  }, [mode, sourcesAdded]);

  // Update map language on symbol layers
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
    if (inspectRef.current?._showInspectMap) return;
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
      // Parse the translated name from the names JSON string using string ops.
      // Search for "XX":"value" in the common object and extract value.
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

  // Keep window.map in sync
  useEffect(() => {
    window.map = mapRef.current;
  });

  // Sync inspect mode with header toggle
  useEffect(() => {
    const inspect = inspectRef.current;
    if (!inspect || !mapRef.current) return;
    if (inspectMode !== inspect._showInspectMap) {
      inspect.toggleInspector();
    }
  }, [inspectMode]);

  // Toggle globe/mercator projection
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    mapRef.current.setProjection({
      type: globeMode ? "globe" : "mercator",
    });
  }, [globeMode, mapLoaded]);

  return (
    <>
      <div className={`map ${mode} tour-map`}>
        <div
          ref={mapContainer}
          style={{
            position: "fixed",
            width: "100%",
            height: "calc(100vh - 60px)",
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
          <Navigator
            open={navigatorOpen}
            setOpen={setNavigatorOpen}
            map={useRef}
            setVisibleTypes={setVisibleTypes}
            setActiveThemes={setActiveThemes}
          />

          {features.length > 0 && (
            <InspectorPanel
              mode={mode}
              activeFeature={activeFeature}
              setActiveFeature={setActiveFeature}
              features={features}
              setFeatures={setFeatures}
              activeThemes={activeThemes}
              setActiveThemes={setActiveThemes}
            />
          )}
          <ThemeSelector
            mode={mode}
            visibleTypes={visibleTypes}
            setVisibleTypes={setVisibleTypes}
            activeThemes={activeThemes}
            setActiveThemes={setActiveThemes}
            themeRef={themeRef}
          ></ThemeSelector>
        </div>

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
  setZoom: PropTypes.func.isRequired,
  navigatorOpen: PropTypes.bool.isRequired,
  setNavigatorOpen: PropTypes.func.isRequired,
  themeRef: PropTypes.object.isRequired,
  visibleTypes: PropTypes.array.isRequired,
  setVisibleTypes: PropTypes.func.isRequired,
  onMapReady: PropTypes.func,
  inspectMode: PropTypes.bool.isRequired,
  globeMode: PropTypes.bool.isRequired,
};
