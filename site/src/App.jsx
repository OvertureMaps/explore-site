import "./App.css";
import Header from "./nav/Header";
import Map from "./Map";
import { MapProvider } from "react-map-gl/maplibre";
import { getTheme, keepTheme, darkTheme, lightTheme } from "./themeUtils";
import { useState, useEffect } from "react";
import Tour from "./Tour";
import StartupBox from "./StartupBox";
import { ThemeProvider } from "@mui/material";
import Sidecar from "./Sidecar";

function App() {
  const [modeName, setModeName] = useState(getTheme());
  const [run, setRun] = useState(false);
  const [tour, setTour] = useState(!(localStorage.getItem("tour") === "true"));
  const [open, setOpen] = useState(tour);
  const [sidecarOpen, setSidecarOpen] = useState(!open);
  const [mapEntity, setMapEntity] = useState({});
  const [zoom, setZoom] = useState(16);

  const startTour = () => {
    setOpen(false);
    setRun(true);
  };

  const updateTour = (event) => {
    localStorage.setItem("tour", event.target.checked);
    setTour(!tour);
  };

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
          setSidecarOpen={setSidecarOpen}
        />
        <Tour
          run={run}
          modeName={modeName}
          setMapEntity={setMapEntity}
          setSidecarOpen={setSidecarOpen}
        />
        <MapProvider>
          <Header
            mode={modeName}
            setMode={setModeName}
            zoom={zoom}
            setZoom={setZoom}
          />
          <Map
            mode={modeName}
            mapEntity={mapEntity}
            setMapEntity={setMapEntity}
            setZoom={setZoom}
            sidecarOpen={sidecarOpen}
            setSidecarOpen={setSidecarOpen}
          />
        </MapProvider>
      </ThemeProvider>
    </div>
  );
}

export default App;
