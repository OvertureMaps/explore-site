'use client';

import "@/components/CustomControls.css";
import Header from "@/components/nav/Header";
import Map from "@/components/Map";
import MapContext from "@/lib/MapContext";
import { keepTheme, setTheme, darkTheme, lightTheme } from "@/lib/themeUtils";
import { useState, useEffect } from "react";
import { ThemeProvider } from "@mui/material";
import variables from "@/lib/map-styles/variables.json";

// Build initial visible types from variables.json (all types visible on load)
const INITIAL_VISIBLE_TYPES = Object.entries(variables)
  .filter(([k]) => k !== "global")
  .flatMap(([, themeData]) =>
    Object.keys(themeData).filter((k) => k !== "_meta")
  );

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

  const [visibleTypes, setVisibleTypes] = useState(INITIAL_VISIBLE_TYPES);

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
            setZoom={setZoom}
            setActiveFeature={setActiveFeature}
            activeFeature={activeFeature}
            visibleTypes={visibleTypes}
            setVisibleTypes={setVisibleTypes}
            onMapReady={setMapInstance}
            inspectMode={inspectMode}
            globeMode={globeMode}
          />
        </MapContext.Provider>
      </ThemeProvider>
    </div>
  );
}
