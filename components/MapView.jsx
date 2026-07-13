import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";
import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import "@/components/CustomControls.css";
import SidePanel from "@/components/SidePanel";
import BookmarkDial from "@/components/BookmarkDial";
import FeaturePopup from "@/components/FeatureSelector";
import { loadPmtilesFromStac } from "@/lib/stacService";
import { getInspectTokens } from "@/components/map";
import fontsJson from "@/components/map/tokens/primitive/fonts.json";
import {
  addSources,
  addAllLayers,
  updateLayerVisibility,
  highlightFeature,
  getInteractiveLayerIds,
  isTypeVisible,
  addInspectLayers,
  updateInspectVisibility,
} from "@/lib/LayerManager";

// Set RTL text plugin for Arabic/Hebrew rendering (must be called once, before map init)
try {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
  maplibregl.setRTLTextPlugin(`${basePath}/mapbox-gl-rtl-text.js`, null, true);
} catch {
  // Already set — ignore
}

// Load PMTiles URLs from STAC catalog at module load time
const pmtilesPromise = loadPmtilesFromStac();

// All font family names used by the map (must match @font-face declarations in globals.css)
const fontNames = Object.values(fontsJson).flatMap((variants) =>
  Object.values(variants)
);

const INITIAL_CENTER = [-80, 10];
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
  inspectVisibleTypes,
  setInspectVisibleTypes,
  defaultInspectVisibleTypes,
  onMapReady,
  globeMode,
  pendingFeature,
  setPendingFeature,
  initialPosition,
  initialSlider,
  onSliderChange,
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [pmtilesUrls, setPmtilesUrls] = useState({});
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [sourcesAdded, setSourcesAdded] = useState(false);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("layers");

  const [lastClickedCoords, setLastClickedCoords] = useState();

  const visibleTypesRef = useRef(visibleTypes);
  useEffect(() => {
    visibleTypesRef.current = visibleTypes;
  }, [visibleTypes]);

  const inspectVisibleTypesRef = useRef(inspectVisibleTypes);
  useEffect(() => {
    inspectVisibleTypesRef.current = inspectVisibleTypes;
  }, [inspectVisibleTypes]);

  const activeFeatureRef = useRef(null);

  const inspectMapContainer = useRef(null);
  const inspectMapRef = useRef(null);
  const containerRef = useRef(null);
  const [sliderPosition, setSliderPosition] = useState(initialSlider ?? 0.5);
  const sliderPositionRef = useRef(initialSlider ?? 0.5);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);
  const [inspectMapLoaded, setInspectMapLoaded] = useState(false);
  const [clickedMap, setClickedMap] = useState(null);

  useEffect(() => {
    sliderPositionRef.current = sliderPosition;
    onSliderChange?.(sliderPosition);
  }, [sliderPosition, onSliderChange]);

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

  // Wait for map fonts to be loaded by the browser
  useEffect(() => {
    Promise.all(fontNames.map((name) => {
      try {
        document.fonts.load(`24px "${name}"`)
      } catch (e) {
        // fail gracefully if font loading 403/404s
      }
    })).then(
      (x) => setFontsLoaded(true)
    );
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

    // Determine which map the cursor is over based on divider position
    function pickTargetMap(e) {
      const container = containerRef.current;
      if (!container || !inspectMapRef.current) return { targetMap: map, targetItems: visibleTypesRef.current };
      const rect = container.getBoundingClientRect();
      const clickRatio = (e.originalEvent.clientX - rect.left) / rect.width;
      if (clickRatio >= sliderPositionRef.current) {
        return { targetMap: inspectMapRef.current, targetItems: inspectVisibleTypesRef.current };
      }
      return { targetMap: map, targetItems: visibleTypesRef.current };
    }

    // Click handler
    map.on("click", (e) => {
      const { targetMap, targetItems } = pickTargetMap(e);
      const interactiveIds = getInteractiveLayerIds(targetMap, targetItems);

      const queriedFeatures = interactiveIds.length > 0
        ? targetMap.queryRenderedFeatures(e.point, { layers: interactiveIds })
        : [];

      const clickedFeatures = [];
      const seenIds = new Set();

      for (const feature of queriedFeatures) {
        if (targetMap.getZoom() < 10 && feature.source === "base") {
          continue;
        }

        if (isTypeVisible(feature.layer["source-layer"], targetItems)) {
          if (!seenIds.has(feature.properties.id)) {
            clickedFeatures.push(feature);
            seenIds.add(feature.properties.id);
          }
        }
      }

      if (clickedFeatures.length > 0) {
        setLastClickedCoords({
          longitude: e.lngLat.lng,
          latitude: e.lngLat.lat,
        });
        setClickedMap(targetMap);
        setFeatures(clickedFeatures);
        setActiveFeature(clickedFeatures[0]);
        setActiveTab("features");
        setDrawerOpen(true);
      } else {
        setLastClickedCoords(null);
        setFeatures([]);
        setActiveFeature(null);
      }
    });

    // Cursor handler
    map.on("mousemove", (e) => {
      const { targetMap, targetItems } = pickTargetMap(e);
      const interactiveIds = getInteractiveLayerIds(targetMap, targetItems);

      if (interactiveIds.length === 0) {
        map.getCanvas().style.cursor = "auto";
        return;
      }

      const featuresAtPoint = targetMap.queryRenderedFeatures(e.point, {
        layers: interactiveIds,
      });

      map.getCanvas().style.cursor =
        featuresAtPoint.some(
          (f) =>
            !(targetMap.getZoom() < 10 && f.source === "base") &&
            isTypeVisible(f.layer["source-layer"], targetItems)
        )
          ? "pointer"
          : "auto";
    });

    mapRef.current = map;
    window.map = map;
    if (onMapReady) onMapReady(map);

    // Create inspect map (non-interactive overlay, camera-synced)
    const inspectMap = new maplibregl.Map({
      container: inspectMapContainer.current,
      style: MAP_STYLE,
      center: initialPosition?.center || INITIAL_CENTER,
      zoom: initialPosition?.zoom || INITIAL_ZOOM,
      bearing: 0,
      pitch: 0,
      hash: false,
      attributionControl: false,
      interactive: false,
    });

    inspectMap.on("load", () => setInspectMapLoaded(true));

    map.on("move", () => {
      inspectMap.jumpTo({
        center: map.getCenter(),
        zoom: map.getZoom(),
        bearing: map.getBearing(),
        pitch: map.getPitch(),
      });
    });

    inspectMapRef.current = inspectMap;

    return () => {
      map.remove();
      inspectMap.remove();
      maplibregl.removeProtocol("pmtiles");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Add sources and layers when map is loaded, PMTiles URLs are ready, and fonts are loaded
  useEffect(() => {
    if (!mapLoaded || !fontsLoaded || !mapRef.current || Object.keys(pmtilesUrls).length === 0) return;

    const map = mapRef.current;
    addSources(map, pmtilesUrls);
    addAllLayers(map, visibleTypes).then(() => setSourcesAdded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapLoaded, fontsLoaded, pmtilesUrls]);

  // Add sources and inspect layers to the inspect map
  useEffect(() => {
    if (!inspectMapLoaded || !inspectMapRef.current || Object.keys(pmtilesUrls).length === 0) return;
    const inspectMap = inspectMapRef.current;
    addSources(inspectMap, pmtilesUrls);
    addInspectLayers(inspectMap, inspectVisibleTypesRef.current);
  }, [inspectMapLoaded, pmtilesUrls]);

  // Update explore-map layer visibility when visibleTypes change
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
    updateLayerVisibility(mapRef.current, visibleTypes);
  }, [visibleTypes, sourcesAdded]);

  // Update inspect-map layer visibility when its own inspectVisibleTypes change
  useEffect(() => {
    if (!inspectMapLoaded || !inspectMapRef.current) return;
    updateInspectVisibility(inspectMapRef.current, inspectVisibleTypes);
  }, [inspectVisibleTypes, inspectMapLoaded]);

  // Update map language on symbol layers
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
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

  // Toggle globe/mercator projection
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const projection = { type: globeMode ? "globe" : "mercator" };
    mapRef.current.setProjection(projection);
    if (inspectMapRef.current) {
      inspectMapRef.current.setProjection(projection);
    }
  }, [globeMode, mapLoaded]);

  // Resize maps when drawer opens/closes
  useEffect(() => {
    if (!mapRef.current) return;
    const timer = setTimeout(() => {
      mapRef.current?.resize();
      inspectMapRef.current?.resize();
    }, 250);
    return () => clearTimeout(timer);
  }, [drawerOpen]);

  // Divider drag handlers
  const handleDividerStart = useCallback((e) => {
    e.preventDefault();
    draggingRef.current = true;
    setDragging(true);
  }, []);

  useEffect(() => {
    const handleMove = (e) => {
      if (!draggingRef.current) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setSliderPosition(Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)));
    };
    const handleEnd = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      setDragging(false);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleMove);
    window.addEventListener("touchend", handleEnd);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, []);

  return (
    <>
      <div className={`map ${mode} tour-map`}>
        <div
          ref={containerRef}
          style={{
            position: "fixed",
            top: 60,
            left: drawerOpen ? 340 : 0,
            width: drawerOpen ? "calc(100% - 340px)" : "100%",
            height: "calc(100vh - 60px)",
            transition: "left 225ms cubic-bezier(0,0,0.2,1), width 225ms cubic-bezier(0,0,0.2,1)",
            userSelect: dragging ? "none" : undefined,
          }}
        >
          <div ref={mapContainer} style={{ position: "absolute", inset: 0 }} />
          <div
            ref={inspectMapContainer}
            style={{
              position: "absolute",
              inset: 0,
              clipPath: `inset(0 0 0 ${sliderPosition * 100}%)`,
              pointerEvents: "none",
              background: "#121212",
              transition: !dragging ? "clip-path 300ms ease" : undefined,
            }}
          />
          {/* Divider with snap handle */}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              // Clamp the rendered position so the handle never straddles the
              // viewport edge and get half-clipped at the extremes (0/1). The
              // clip-path above still uses the true sliderPosition, so the maps
              // collapse fully — only the grab handle is held a margin inward.
              left: `clamp(20px, ${sliderPosition * 100}%, calc(100% - 20px))`,
              width: 20,
              marginLeft: -10,
              cursor: "col-resize",
              // Sits between the map canvas (z-index auto/0, so the handle is
              // draggable) and MapLibre's control corners (z-index 2 in
              // maplibre-gl.css, so zoom/rotate/geolocate buttons stay
              // clickable). .maplibregl-map is position:relative with no
              // z-index, so it's not a stacking context and these compare
              // directly here.
              zIndex: 1,
              touchAction: "none",
              transition: !dragging ? "left 300ms ease" : undefined,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onMouseDown={handleDividerStart}
            onTouchStart={handleDividerStart}
            onDoubleClick={() => setSliderPosition(0.5)}
          >
            {/* Visible divider line */}
            <div style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "50%",
              width: 4,
              marginLeft: -2,
              background: "#000",
              pointerEvents: "none",
            }} />
            {/* Handle pill with snap buttons */}
            <div style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              background: "rgba(0,0,0,0.8)",
              borderRadius: 14,
              padding: "6px 2px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            }}>
              <button
                onClick={() => setSliderPosition(0)}
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  background: "none",
                  border: "none",
                  color: sliderPosition < 0.01 ? "rgba(255,255,255,0.2)" : "#fff",
                  cursor: sliderPosition < 0.01 ? "default" : "pointer",
                  padding: "2px 4px",
                  fontSize: 12,
                  lineHeight: 1,
                  display: "flex",
                }}
                title="Full inspect view"
                disabled={sliderPosition < 0.01}
              >
                ◀
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "6px 0" }}>
                <div style={{ width: 10, height: 2, background: "rgba(255,255,255,0.35)", borderRadius: 1 }} />
                <div style={{ width: 10, height: 2, background: "rgba(255,255,255,0.35)", borderRadius: 1 }} />
                <div style={{ width: 10, height: 2, background: "rgba(255,255,255,0.35)", borderRadius: 1 }} />
              </div>
              <button
                onClick={() => setSliderPosition(1)}
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  background: "none",
                  border: "none",
                  color: sliderPosition > 0.99 ? "rgba(255,255,255,0.2)" : "#fff",
                  cursor: sliderPosition > 0.99 ? "default" : "pointer",
                  padding: "2px 4px",
                  fontSize: 12,
                  lineHeight: 1,
                  display: "flex",
                }}
                title="Full explore view"
                disabled={sliderPosition > 0.99}
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        <FeaturePopup
          map={clickedMap || mapRef.current}
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
          inspectVisibleTypes={inspectVisibleTypes}
          setInspectVisibleTypes={setInspectVisibleTypes}
          defaultInspectVisibleTypes={defaultInspectVisibleTypes}
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
  defaultVisibleTypes: PropTypes.array,
  inspectVisibleTypes: PropTypes.array.isRequired,
  setInspectVisibleTypes: PropTypes.func.isRequired,
  defaultInspectVisibleTypes: PropTypes.array,
  onMapReady: PropTypes.func,
  globeMode: PropTypes.bool.isRequired,
  pendingFeature: PropTypes.object,
  setPendingFeature: PropTypes.func.isRequired,
  initialPosition: PropTypes.object,
  initialSlider: PropTypes.number,
  onSliderChange: PropTypes.func,
};
