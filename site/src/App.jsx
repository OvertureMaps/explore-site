import "./App.css";
import Header from "./nav/Header";
import QaBar from "./qa_info_bar/QaBar";
import Map from "./Map";
import { MapProvider } from "react-map-gl/maplibre";
import { getTheme, keepTheme, darkTheme, lightTheme } from "./themeUtils";
import { useState, useEffect, useRef, useCallback } from "react";
import Tour from "./Tour";
import StartupBox from "./StartupBox";
import { ThemeProvider } from "@mui/material";
import { useNavigatorState } from "./navigator/Navigator";
import { INITIAL_VIEW_STATE } from "./MapLibreMap";

function App() {
  const [modeName, setModeName] = useState(getTheme());
  const [run, setRun] = useState(false);
  const [tour, setTour] = useState(!(localStorage.getItem("tour") === "true"));
  const [open, setOpen] = useState(tour);
  const [navigatorOpen, setNavigatorOpen] = useNavigatorState(open);

  const [features, setFeatures] = useState([]);
  const [zoom, setZoom] = useState(0);
  const themeRef = useRef(null);
  const [activeFeature, setActiveFeature] = useState(null);
  const [activeOsmFeature, setActiveOsmFeature] = useState(null);

  const startTour = () => {
    setOpen(false);
    setRun(true);
  };

  const updateTour = (event) => {
    localStorage.setItem("tour", event.target.checked);
    setTour(!tour);
  };
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
  const onMove = useCallback((evt) => setViewState(evt.viewState), []);

  const [visibleTypes, setVisibleTypes] = useState([]);

  useEffect(() => {
    keepTheme(setModeName);
  }, [setModeName]);

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
        <MapProvider>
          <Header
            mode={modeName}
            setMode={setModeName}
            zoom={zoom}
            setZoom={setZoom}
            visibleTypes={visibleTypes}
          />
          <QaBar
            viewState={viewState}
            setViewState={setViewState}
            activeOsmFeature={activeOsmFeature}
            setActiveOsmFeature={setActiveOsmFeature}
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
            activeOsmFeature={activeOsmFeature}
            visibleTypes={visibleTypes}
            setVisibleTypes={setVisibleTypes}
            viewState={viewState}
            setViewState={setViewState}
            onMove={onMove}
          />
        </MapProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
