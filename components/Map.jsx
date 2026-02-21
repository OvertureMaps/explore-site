import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";

import { useState, useEffect, useRef } from "react";
import InspectorPanel from "@/components/inspector_panel/InspectorPanel";
import PropTypes from "prop-types";
import "@/components/CustomControls.css";
import ThemeSelector from "@/components/ThemeSelector";
import BugIcon from "@/components/icons/icon-bug.svg?react";
import Navigator from "@/components/navigator/Navigator";
import FeaturePopup from "@/components/FeatureSelector";
import { loadPmtilesFromStac } from "@/lib/stacService";
import {
  addSources,
  addAllLayers,
  updateLayerVisibility,
  updateDivisionLabelMode,
  highlightFeature,
  getInteractiveLayerIds,
} from "@/lib/LayerManager";

// Load PMTiles URLs from STAC catalog at module load time
const pmtilesPromise = loadPmtilesFromStac();

const INITIAL_CENTER = [-77.036495, 38.90678];
const INITIAL_ZOOM = 15;

// this reference must remain constant to avoid re-renders
const MAP_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {},
  layers: [],
};

export default function Map({
  mode,
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
}) {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
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

    map.on("load", () => {
      setMapLoaded(true);
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
    updateLayerVisibility(mapRef.current, activeThemes, visibleTypes);
  }, [visibleTypes, activeThemes, sourcesAdded]);

  // Update division label colors on mode change
  useEffect(() => {
    if (!sourcesAdded || !mapRef.current) return;
    updateDivisionLabelMode(mapRef.current, mode);
  }, [mode, sourcesAdded]);

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

        <div className="bug-nub">
          <a
            className="bug-nub-link"
            href="https://github.com/OvertureMaps/explore-site/issues/new/choose"
            target="_blank"
          >
            <BugIcon className="bug-nub-icon" />
          </a>
        </div>
      </div>
    </>
  );
}

Map.propTypes = {
  mode: PropTypes.string.isRequired,
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
};
