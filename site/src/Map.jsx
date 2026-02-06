import {
  Map as MapLibreMap,
  NavigationControl,
  Source,
  AttributionControl,
  ScaleControl,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";

import { useState, useEffect, useCallback, useRef } from "react";
import { Layer, GeolocateControl } from "react-map-gl/maplibre";
import InspectorPanel from "./inspector_panel/InspectorPanel";
import PropTypes from "prop-types";
import "./CustomControls.css";
import ThemeSelector from "./ThemeSelector";
import BugIcon from "./icons/icon-bug.svg?react";
import Navigator from "./navigator/Navigator";
import { layers } from "./Layers";
import ThemeTypeLayer from "./ThemeTypeLayer";
import FeaturePopup from "./FeatureSelector";
import { loadPmtilesFromStac } from "./stacService";

// Load PMTiles URLs from STAC catalog at module load time
const pmtilesPromise = loadPmtilesFromStac();

const INITIAL_VIEW_STATE = {
  latitude: 38.90678,
  longitude: -77.036495,
  zoom: 15,
  bearing: 0,
  pitch: 0,
};

// this reference must remain constant to avoid re-renders
const MAP_STYLE = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {},
  layers: [],
};

const ThemeSource = ({ name, url }) => {
  if (!url) return null;
  return <Source id={name} type="vector" url={`pmtiles://${url}`} />;
};

ThemeSource.propTypes = {
  name: PropTypes.string.isRequired,
  url: PropTypes.string,
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
}) {
  const mapRef = useRef();

  const [cursor, setCursor] = useState("auto");
  const [pmtilesUrls, setPmtilesUrls] = useState({});

  // Load PMTiles URLs from STAC catalog
  useEffect(() => {
    pmtilesPromise.then((urls) => {
      // Convert Map to object for state
      const urlsObj = Object.fromEntries(urls);
      setPmtilesUrls(urlsObj);
    }).catch((error) => {
      console.error("Failed to load PMTiles from STAC catalog:", error);
    });
  }, []);

  const [activeThemes, setActiveThemes] = useState([
    "places",
    "addresses",
    "buildings",
    "transportation",
  ]);
  const [interactiveLayerIds, setInteractiveLayerIds] = useState([]);

  const [lastClickedCoords, setLastClickedCoords] = useState();

  // For access of latest value within map events
  const activeThemesRef = useRef(activeThemes);
  useEffect(() => {
    activeThemesRef.current = activeThemes;
  }, [activeThemes]);

  const syncInteractiveLayerIds = useCallback(() => {
    const layers = mapRef.current.getStyle().layers;
    const layersToShow = layers
      .filter((layer) => {
        return visibleTypes.indexOf(layer["source-layer"]) >= 0;
      })
      .map((layer) => layer.id);
    setInteractiveLayerIds(layersToShow);
  }, [visibleTypes]);

  const onMouseEnter = useCallback(
    (e) => {
      if (
        e.features.some(
          (f) => visibleTypes.indexOf(f.layer["source-layer"]) >= 0
        )
      ) {
        setCursor("pointer");
      }
    },
    [visibleTypes]
  );
  const onMouseLeave = useCallback(() => setCursor("auto"), []);

  useEffect(() => {
    const protocol = new pmtiles.Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);

    return () => {
      maplibregl.removeProtocol("pmtiles");
    };
  }, []);

  useEffect(() => {
    window.map = mapRef.current;
  });

  const activeFeatureRef = useRef(null);

  useEffect(() => {
    // Remove feature state from previous active feature
    if (activeFeatureRef.current) {
      mapRef.current.removeFeatureState({
        source: activeFeatureRef.current.source,
        sourceLayer: activeFeatureRef.current.sourceLayer,
        id: activeFeatureRef.current.id,
      });
    }

    // Set feature state for new active feature
    if (activeFeature) {
      mapRef.current.setFeatureState(
        {
          source: activeFeature.source,
          sourceLayer: activeFeature.sourceLayer,
          id: activeFeature.id,
        },
        { selected: true }
      );
    }

    activeFeatureRef.current = activeFeature;
  }, [activeFeature]);

  const onClick = useCallback(
    (event) => {
      setLastClickedCoords({
        longitude: event.lngLat.lng,
        latitude: event.lngLat.lat,
      });

      const clickedFeatures = [];
      const seenIds = new Set();

      for (const feature of event.features) {
        if (visibleTypes.indexOf(feature.layer["source-layer"]) >= 0) {
          // Only add if we haven't seen this ID before
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
    },
    [visibleTypes, setFeatures, setActiveFeature]
  );

  const handleZoom = (event) => {
    setZoom(event.target.getZoom());
  };

  return (
    <>
      <div className={`map ${mode} tour-map`}>
        <MapLibreMap
          id="myMap"
          ref={mapRef}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onLoad={syncInteractiveLayerIds}
          onClick={onClick}
          cursor={cursor}
          hash={true}
          onZoom={handleZoom}
          mapStyle={MAP_STYLE}
          interactiveLayerIds={interactiveLayerIds}
          initialViewState={INITIAL_VIEW_STATE}
          style={{
            position: "fixed",
            width: "100%",
            height: "calc(100vh - 60px)",
          }}
          attributionControl={false}
        >
          <ThemeSource name="base" url={pmtilesUrls["base"]} />
          <ThemeSource name="buildings" url={pmtilesUrls["buildings"]} />
          <ThemeSource name="places" url={pmtilesUrls["places"]} />
          <ThemeSource name="divisions" url={pmtilesUrls["divisions"]} />
          <ThemeSource name="transportation" url={pmtilesUrls["transportation"]} />
          <ThemeSource name="addresses" url={pmtilesUrls["addresses"]} />

          <FeaturePopup
            coordinates={lastClickedCoords}
            features={features}
            onClose={() => setLastClickedCoords(null)}
            setActiveFeature={setActiveFeature}
            activeFeature={activeFeature}
          />

          {[false, true].map((label) => {
            return layers.map((layerProps, i) => {
              const {
                theme,
                type,
                color,
                activeColor,
                activeOnly,
                ...otherProps
              } = layerProps;

              return (
                <ThemeTypeLayer
                  key={`${theme}_${type}_${i}`}
                  {...otherProps}
                  theme={theme}
                  type={type}
                  color={activeThemes.includes(theme)
                    ? activeColor || color
                    : color}
                  visible={
                    visibleTypes.includes(type) &&
                    (activeOnly === undefined ||
                      activeThemes.includes(theme))
                  }
                  label={label && activeThemes.includes(theme)}
                  active={activeThemes.includes(theme)}
                  activeThemes={activeThemes}
                  highlightColor={
                    activeThemes.includes(theme)
                      ? activeColor
                        ? color
                        : undefined
                      : activeColor
                  }
                />
              );
            });
          })}
          <Layer
            id="divisions_division"
            type="symbol"
            source="divisions"
            source-layer="division"
            filter={[
              "all",
              ["has", "@name"],
              [
                "step",
                ["zoom"],
                ["==", "$type", "Point"],
                2,
                [
                  "match",
                  ["get", "subtype"],
                  ["country", "dependency"],
                  true,
                  false,
                ],
                4,
                [
                  "match",
                  ["get", "subtype"],
                  ["macroregion", "region"],
                  true,
                  false,
                ],
                8,
                [
                  "match",
                  ["get", "subtype"],
                  ["macrocounty", "county"],
                  true,
                  false,
                ],
                10,
                [
                  "match",
                  ["get", "subtype"],
                  ["county", "localadmin"],
                  true,
                  false,
                ],
                12,
                [
                  "match",
                  ["get", "subtype"],
                  [
                    "localadmin",
                    "locality",
                    "borough",
                    "macrohood",
                    "neighborhood",
                    "microhood",
                  ],
                  true,
                  false,
                ],
              ],
            ]}
            paint={{
              "text-color":
                mode === "theme-light" ? "hsla(201, 29%, 15%, 1)" : "white",
              "text-halo-color": mode === "theme-light" ? "white" : "black",
              "text-halo-width": 1,
            }}
            layout={{
              "text-font": ["Noto Sans Regular"],
              "text-field": ["get", "@name"],
              "text-size": [
                "interpolate",
                ["linear"],
                ["zoom"],
                2,
                10,
                10,
                14,
                12,
                12,
                16,
                16,
              ],
              "text-line-height": 1,
              "text-padding": 6,
              "text-max-width": 4,
            }}
          />

          <NavigationControl position="top-right"></NavigationControl>
          <GeolocateControl />
          <ScaleControl position="bottom-left" />
          <AttributionControl customAttribution='<a href="https://openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>, <a href="https://overturemaps.org" target="_blank">Overture Maps Foundation</a>' />
        </MapLibreMap>

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
};
