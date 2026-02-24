'use client';

import "@/components/CustomControls.css";
import Header from "@/components/nav/Header";
import Map from "@/components/Map";
import MapContext from "@/lib/MapContext";
import { getTheme, keepTheme, darkTheme, lightTheme } from "@/lib/themeUtils";
import { useState, useEffect, useRef } from "react";
import Tour from "@/components/Tour";
import StartupBox from "@/components/StartupBox";
import { ThemeProvider } from "@mui/material";
import { useNavigatorState } from "@/components/navigator/useNavigatorState";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [modeName, setModeName] = useState("theme-dark");
  const [run, setRun] = useState(false);
  const [tour, setTour] = useState(true);
  const [open, setOpen] = useState(false);
  const [navigatorOpen, setNavigatorOpen] = useNavigatorState(false);

  const [features, setFeatures] = useState([]);
  const [zoom, setZoom] = useState(0);
  const themeRef = useRef(null);
  const [activeFeature, setActiveFeature] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const startTour = () => {
    setOpen(false);
    setRun(true);
  };

  const updateTour = (event) => {
    localStorage.setItem("tour", event.target.checked);
    setTour(!tour);
  };

  const [visibleTypes, setVisibleTypes] = useState([]);

  useEffect(() => {
    // Initialize theme and tour state from localStorage
    keepTheme(setModeName);
    const tourPref = localStorage.getItem("tour") === "true";
    const shouldShowTour = !tourPref;
    setTour(shouldShowTour);
    setOpen(shouldShowTour);
    setMounted(true);
  }, []);

  // Prevent hydration mismatch — render nothing until client-side mount
  if (!mounted) {
    return null;
  }

  return (
    <div>
      <ThemeProvider theme={modeName === "theme-dark" ? darkTheme : lightTheme}>
        <StartupBox
          startTour={startTour}
          updateTour={updateTour}
          open={open}
          setOpen={setOpen}
          mode={modeName}
          setNavigatorOpen={setNavigatorOpen}
          setMode={setModeName}
          zoom={zoom}
          setZoom={setZoom}
          visibleTypes={visibleTypes}
        />
        <Tour
          run={run}
          modeName={modeName}
          setFeatures={setFeatures}
          setNavigatorOpen={setNavigatorOpen}
          themeRef={themeRef}
          setZoom={setZoom}
          visibleTypes={visibleTypes}
          setVisibleTypes={setVisibleTypes}
        />
        <MapContext.Provider value={mapInstance}>
          <Header
            mode={modeName}
            setMode={setModeName}
            zoom={zoom}
            setZoom={setZoom}
            visibleTypes={visibleTypes}
          />
          <Map
            mode={modeName}
            features={features}
            setFeatures={setFeatures}
            setZoom={setZoom}
            navigatorOpen={navigatorOpen}
            setNavigatorOpen={setNavigatorOpen}
            themeRef={themeRef}
            setActiveFeature={setActiveFeature}
            activeFeature={activeFeature}
            visibleTypes={visibleTypes}
            setVisibleTypes={setVisibleTypes}
            onMapReady={setMapInstance}
          />
        </MapContext.Provider>
      </ThemeProvider>
    </div>
  );
}
