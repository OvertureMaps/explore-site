import "maplibre-gl/dist/maplibre-gl.css";
import * as pmtiles from "pmtiles";
import maplibregl from "maplibre-gl";

import { useState, useEffect, useCallback, useRef } from "react";
import InspectorPanel from "./inspector_panel/InspectorPanel";
import PropTypes from "prop-types";
import "./CustomControls.css";
import ThemeSelector from "./ThemeSelector";
import BugIcon from "./icons/icon-bug.svg?react";
import Navigator from "./navigator/Navigator";
import Map, { INITIAL_VIEW_STATE } from "./MapLibreMap";
import CompareToggle, { useComparisonState } from "./CompareToggle";
import VersionSelector from "./VersionSelector";

function getDateStamp(dayIndex) {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate() - dayIndex).padStart(2, '0');
  const returnStr = `${year}-${month}-${day}`;
  console.log(returnStr);

  return returnStr;
}

const getPmtilesUrl = (version) =>
  `pmtiles://https://d3c1b7bog2u1nn.cloudfront.net/${version.split(".")[0]}/`;

const TODAY_DS = getDateStamp(0) ;
const YESTERDAY_DS = getDateStamp(1);

const getTodaysQaPmtilesUrl = (date) =>
  `pmtiles://https://dr23tlpzrppt2.cloudfront.net/nightlies/ds=2025-04-01/`;

const getYesterdaysQaPmtilesUrl = (date) =>
  `pmtiles://https://dr23tlpzrppt2.cloudfront.net/nightlies/ds=2025-03-30/`;

const ThemeSource = ({ name, url }) => {
  return <Source id={name} type="vector" url={`${url}${name}.pmtiles`} />;
};

ThemeSource.propTypes = {
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
};

export default function MapContainer({
  mode,
  features,
  setFeatures,
  activeFeature,
  setActiveFeature,
  setZoom,
  navigatorOpen,
  setNavigatorOpen,
  themeRef,
}) {
  const leftMapRef = useRef();
  const rightMapRef = useRef();

  const [cursor, setCursor] = useState("auto");

  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const {
    compareMode,
    setCompareMode,
    activeMap,
    setActiveMap,
    leftMapStyle,
    rightMapStyle,
    leftVersion,
    setLeftVersion,
    rightVersion,
    setRightVersion,
  } = useComparisonState();

  const onMove = useCallback((evt) => setViewState(evt.viewState), []);

  const [activeThemes, setActiveThemes] = useState([
    "places",
    "addresses",
    "buildings",
    "transportation",
  ]);
  const [visibleTypes, setVisibleTypes] = useState([]);
  const [interactiveLayerIds, setInteractiveLayerIds] = useState([]);

  const [lastClickedCoords, setLastClickedCoords] = useState();

  // For access of latest value within map events
  const activeThemesRef = useRef(activeThemes);
  useEffect(() => {
    activeThemesRef.current = activeThemes;
  }, [activeThemes]);

  const syncInteractiveLayerIds = useCallback(() => {
    const layers = leftMapRef.current.getStyle().layers;
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
    window.map = leftMapRef.current;
  });

  const activeFeatureRef = useRef(null);

  useEffect(() => {
    // Remove feature state from previous active feature
    if (activeFeatureRef.current) {
      leftMapRef.current.removeFeatureState({
        source: activeFeatureRef.current.source,
        sourceLayer: activeFeatureRef.current.sourceLayer,
        id: activeFeatureRef.current.id,
      });
      if (rightMapRef.current) {
        rightMapRef.current.removeFeatureState({
          source: activeFeatureRef.current.source,
          sourceLayer: activeFeatureRef.current.sourceLayer,
          id: activeFeatureRef.current.id,
        });
      }
    }

    // Set feature state for new active feature
    if (activeFeature) {
      leftMapRef.current.setFeatureState(
        {
          source: activeFeature.source,
          sourceLayer: activeFeature.sourceLayer,
          id: activeFeature.id,
        },
        { selected: true }
      );
      if (rightMapRef.current) {
        rightMapRef.current.setFeatureState(
          {
            source: activeFeature.source,
            sourceLayer: activeFeature.sourceLayer,
            id: activeFeature.id,
          },
          { selected: true }
        );
      }
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
    [visibleTypes]
  );

  const handleZoom = (event) => {
    setZoom(event.target.getZoom());
  };

  return (
    <>
      <div className={`map ${mode} tour-map`}>
        <div style={leftMapStyle}>
          {compareMode && (
            <VersionSelector
              version={leftVersion}
              onChange={setLeftVersion}
              style={{ right: "10px" }}
            />
          )}
          <Map
            viewState={viewState}
            mapRef={leftMapRef}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            onLoad={syncInteractiveLayerIds}
            onClick={(event) => {
              setActiveMap("left");
              onClick(event);
            }}
            onMove={onMove}
            cursor={cursor}
            onZoom={handleZoom}
            interactiveLayerIds={interactiveLayerIds}
            style={leftMapStyle}
            mapId="left-map"
            mode={mode}
            visibleTypes={visibleTypes}
            activeThemes={activeThemes}
            PMTILES_URL={getPmtilesUrl(leftVersion)}
            QA_PMTILES_URL={getYesterdaysQaPmtilesUrl(YESTERDAY_DS)}
            showControls={!compareMode}
            lastClickedCoords={lastClickedCoords}
            features={features}
            setActiveFeature={setActiveFeature}
            activeFeature={activeFeature}
            enableFeatureSelector={activeMap === "left"}
          />
        </div>

        {compareMode && (
          <div style={rightMapStyle}>
            <VersionSelector
              version={rightVersion}
              onChange={setRightVersion}
              style={{ left: "10px" }}
            />
            <Map
              viewState={viewState}
              mapRef={rightMapRef}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onLoad={syncInteractiveLayerIds}
              onClick={(event) => {
                setActiveMap("right");
                onClick(event);
              }}
              cursor={cursor}
              onZoom={handleZoom}
              onMove={onMove}
              interactiveLayerIds={interactiveLayerIds}
              style={rightMapStyle}
              mapId="right-map"
              mode={mode}
              visibleTypes={visibleTypes}
              activeThemes={activeThemes}
              PMTILES_URL={getPmtilesUrl(rightVersion)}
              QA_PMTILES_URL={getTodaysQaPmtilesUrl(TODAY_DS)}
              showControls={true}
              lastClickedCoords={lastClickedCoords}
              setLastClickedCoords={setLastClickedCoords}
              features={features}
              setActiveFeature={setActiveFeature}
              activeFeature={activeFeature}
              enableFeatureSelector={activeMap === "right"}
            />
          </div>
        )}

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
            entity={features}
            mode={mode}
            visibleTypes={visibleTypes}
            setVisibleTypes={setVisibleTypes}
            activeThemes={activeThemes}
            setActiveThemes={setActiveThemes}
            themeRef={themeRef}
          />
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
        <CompareToggle
          compareMode={compareMode}
          setCompareMode={setCompareMode}
        />
      </div>
    </>
  );
}

Map.propTypes = {
  mode: PropTypes.string.isRequired,
};
