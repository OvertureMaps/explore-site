'use client';

import "@/components/CustomControls.css";
import Header from "@/components/nav/Header";
import Map from "@/components/MapView";
import MapContext from "@/lib/MapContext";
import TermsOfUse from "@/components/nav/TermsOfUse";
import { keepTheme, darkTheme, lightTheme } from "@/lib/themeUtils";
import { useState, useEffect, useRef } from "react";
import { ThemeProvider } from "@mui/material";
import { defaultLayerSpecs } from "@/components/map";

// All unique overture:item values from layer specs
const ALL_ITEMS = [...new Set(
  defaultLayerSpecs
    .map((spec) => spec.metadata?.["overture:item"])
    .filter(Boolean)
)];

// Items disabled by default
const DEFAULT_OFF = new Set(["place-all-circle", "place-all-density-circle", "building-footprint", "building-part-footprint", "address"]);

const DEFAULT_VISIBLE = ALL_ITEMS.filter((id) => !DEFAULT_OFF.has(id));

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [modeName, setModeName] = useState("theme-dark");

  const [globeMode, setGlobeMode] = useState(true);
  const [features, setFeatures] = useState([]);
  const [zoom, setZoom] = useState(0);
  const [activeFeature, setActiveFeature] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [language, setLanguage] = useState("mul");

  const [visibleTypes, setVisibleTypes] = useState(DEFAULT_VISIBLE);
  const [pendingFeature, setPendingFeature] = useState(null);
  const [initialSlider, setInitialSlider] = useState(null);
  const [sliderPosition, setSliderPosition] = useState(0.5);

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

  useEffect(() => {
    keepTheme(setModeName);

    // Restore state from URL params (shared link)
    const params = new URLSearchParams(window.location.search);
    const layersParam = params.get("layers");
    const featureParam = params.get("feature");

    if (layersParam) {
      setVisibleTypes(layersParam.split(","));
    }

    if (featureParam) {
      const parts = featureParam.split(".");
      if (parts.length >= 3) {
        const [source, sourceLayer, ...rest] = parts;
        setPendingFeature({ source, sourceLayer, gersId: rest.join(".") });
      }
    }

    const modeParam = params.get("mode");
    if (modeParam === "explore") setInitialSlider(1);
    else if (modeParam === "inspect") setInitialSlider(0);

    setMounted(true);
  }, []);

  // Sync mode + feature state to URL in real time.
  // Waits for mapInstance so MapLibre has finished reading the hash
  // before we call replaceState. Only touches search params — leaves the
  // hash alone so MapLibre's position is never clobbered.
  useEffect(() => {
    if (!mounted || !mapInstance) return;
    const params = new URLSearchParams(window.location.search);

    if (sliderPosition >= 0.99) params.set("mode", "explore");
    else if (sliderPosition <= 0.01) params.set("mode", "inspect");
    else params.delete("mode");

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

    // Only touch history when the URL actually changes. Dragging the slider
    // fires this effect on every mousemove, but the mode bucket (and rest of
    // the URL) usually stays the same — calling replaceState each time trips
    // the browser's "100 calls / 10s" rate limit and crashes the page.
    // Note: omit the "?" when there are no params, otherwise newUrl never
    // matches window.location.search ("") and the guard is defeated.
    const search = params.toString();
    const newUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (newUrl !== currentUrl) {
      window.history.replaceState(null, "", newUrl);
    }
  }, [mounted, mapInstance, activeFeature, pendingFeature, sliderPosition]);

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
            globeMode={globeMode}
            setGlobeMode={setGlobeMode}
            activeFeature={activeFeature}
            onGersSelect={({ gersId }) => {
              setPendingFeature({ gersId, searchAll: true });
            }}
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
            defaultVisibleTypes={DEFAULT_VISIBLE}
            onMapReady={setMapInstance}
            globeMode={globeMode}
            pendingFeature={pendingFeature}
            setPendingFeature={setPendingFeature}
            initialPosition={initialPositionRef.current || undefined}
            initialSlider={initialSlider}
            onSliderChange={setSliderPosition}
          />
        </MapContext.Provider>
        <TermsOfUse />
      </ThemeProvider>
    </div>
  );
}
