'use client';

import "@/components/CustomControls.css";
import Header from "@/components/nav/Header";
import Map from "@/components/MapView";
import MapContext from "@/lib/MapContext";
import { keepTheme, setTheme, darkTheme, lightTheme } from "@/lib/themeUtils";
import { useState, useEffect } from "react";
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
const DEFAULT_OFF = new Set(["place-all-circle", "place-all-density-circle", "building_footprint", "building_part_footprint"]);

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
    if (layersParam) {
      setVisibleTypes(layersParam.split(","));
    }
    if (modeParam) {
      setTheme(modeParam, setModeName);
    }

    setMounted(true);
  }, []);

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
          />
        </MapContext.Provider>
      </ThemeProvider>
    </div>
  );
}
