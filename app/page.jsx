'use client';

import "@/components/CustomControls.css";
import Header from "@/components/nav/Header";
import Map from "@/components/MapView";
import MapContext from "@/lib/MapContext";
import { keepTheme, darkTheme, lightTheme } from "@/lib/themeUtils";
import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "@mui/material";
import { defaultLayerSpecs, inspectLayerSpecs } from "@/components/map";

// All unique overture:item values from layer specs
const ALL_ITEMS = [...new Set(
  defaultLayerSpecs
    .map((spec) => spec.metadata?.["overture:item"])
    .filter(Boolean)
)];

const ALL_INSPECT_ITEMS = [...new Set(
  inspectLayerSpecs
    .map((spec) => spec.metadata?.["overture:item"])
    .filter(Boolean)
)];

// Items disabled by default
const DEFAULT_OFF = new Set(["place-all-circle", "place-all-density-circle", "building-footprint", "building-part-footprint", "address"]);

const DEFAULT_VISIBLE = ALL_ITEMS.filter((id) => !DEFAULT_OFF.has(id));
const DEFAULT_INSPECT_VISIBLE = ALL_INSPECT_ITEMS;

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [modeName, setModeName] = useState("theme-dark");

  const [inspectMode, setInspectMode] = useState(false);
  const [globeMode, setGlobeMode] = useState(true);
  const [features, setFeatures] = useState([]);
  const [zoom, setZoom] = useState(0);
  const [activeFeature, setActiveFeature] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [language, setLanguage] = useState("mul");

  const [visibleTypes, setVisibleTypes] = useState(DEFAULT_VISIBLE);
  const [savedExploreTypes, setSavedExploreTypes] = useState(null);
  const [savedInspectTypes, setSavedInspectTypes] = useState(null);
  const [pendingFeature, setPendingFeature] = useState(null);

  // Capture the hash position at page load before anything can overwrite it.
  // MapLibre's hash:true won't see it in time because the component tree
  // doesn't mount until mounted=true (second render).
  const initialPositionRef = useRef(null);
  if (initialPositionRef.current === null && typeof window !== "undefined") {
    const hash = window.location.hash.replace("#", "");
    const parts = hash.split("/");
    if (parts.length >= 3) {
      const [z, lat, lng] = parts.map(Number);
      if (!isNaN(z) && !isNaN(lat) && !isNaN(lng)) {
        initialPositionRef.current = { center: [lng, lat], zoom: z };
      }
    }
    if (!initialPositionRef.current) {
      initialPositionRef.current = false; // mark as checked
    }
  }

  // Swap visibleTypes when toggling inspect mode
  useEffect(() => {
    if (inspectMode) {
      setSavedExploreTypes(visibleTypes);
      setVisibleTypes(savedInspectTypes || DEFAULT_INSPECT_VISIBLE);
    } else if (savedExploreTypes) {
      setSavedInspectTypes(visibleTypes);
      setVisibleTypes(savedExploreTypes);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inspectMode]);

  useEffect(() => {
    keepTheme(setModeName);

    // Restore state from URL params (shared link)
    const params = new URLSearchParams(window.location.search);
    const layersParam = params.get("layers");
    const modeParam = params.get("mode");
    const featureParam = params.get("feature");

    if (modeParam === "inspect") {
      if (layersParam) {
        setSavedInspectTypes(layersParam.split(","));
      }
      setInspectMode(true);
    }
    if (layersParam && modeParam !== "inspect") {
      setVisibleTypes(layersParam.split(","));
    }

    if (featureParam) {
      const parts = featureParam.split(".");
      if (parts.length >= 3) {
        const [source, sourceLayer, ...rest] = parts;
        setPendingFeature({ source, sourceLayer, gersId: rest.join(".") });
      }
    }

    setMounted(true);
  }, []);

  // Sync mode + feature state to URL in real time.
  // Waits for mapInstance so MapLibre has finished reading the hash
  // before we call replaceState. Only touches search params — leaves the
  // hash alone so MapLibre's position is never clobbered.
  useEffect(() => {
    if (!mounted || !mapInstance) return;
    const params = new URLSearchParams(window.location.search);
    params.set("mode", inspectMode ? "inspect" : "explore");

    if (activeFeature?.properties?.id) {
      const featureKey = [
        activeFeature.source,
        activeFeature.sourceLayer,
        activeFeature.properties.id,
      ].join(".");
      params.set("feature", featureKey);
    } else if (!pendingFeature) {
      // Only remove once there is no pending restore in progress
      params.delete("feature");
    }

    const newUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", newUrl);
  }, [mounted, mapInstance, inspectMode, activeFeature, pendingFeature]);

  // Prevent hydration mismatch — render nothing until client-side mount
  if (!mounted) {
    return null;
  }

  return (
    <div>
      <ThemeProvider theme={modeName === "theme-dark" ? darkTheme : lightTheme}>
        <MapContext.Provider value={mapInstance}>
          <Header
            mode={modeName}
            setMode={setModeName}
            zoom={zoom}
            setZoom={setZoom}
            visibleTypes={visibleTypes}
            language={language}
            setLanguage={setLanguage}
            inspectMode={inspectMode}
            setInspectMode={setInspectMode}
            globeMode={globeMode}
            setGlobeMode={setGlobeMode}
            activeFeature={activeFeature}
          />
          <Map
            mode={modeName}
            language={language}
            features={features}
            setFeatures={setFeatures}
            zoom={zoom}
            setZoom={setZoom}
            setActiveFeature={setActiveFeature}
            activeFeature={activeFeature}
            visibleTypes={visibleTypes}
            setVisibleTypes={setVisibleTypes}
            defaultVisibleTypes={inspectMode ? DEFAULT_INSPECT_VISIBLE : DEFAULT_VISIBLE}
            onMapReady={setMapInstance}
            inspectMode={inspectMode}
            globeMode={globeMode}
            pendingFeature={pendingFeature}
            setPendingFeature={setPendingFeature}
            initialPosition={initialPositionRef.current || undefined}
          />
        </MapContext.Provider>
      </ThemeProvider>
    </div>
  );
}
