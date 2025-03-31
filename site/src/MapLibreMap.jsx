import {
  Map as MapLibreMap,
  NavigationControl,
  GeolocateControl,
  AttributionControl,
  Source,
} from "react-map-gl/maplibre";
import ThemeTypeLayer from "./ThemeTypeLayer";
import { Layer } from "react-map-gl/maplibre";
import PropTypes from "prop-types";
import { layers } from "./Layers";
import FeatureSelector from "./FeatureSelector";

const ThemeSource = ({ name, url }) => {
  return <Source id={name} type="vector" url={`${url}${name}.pmtiles`} />;
};

ThemeSource.propTypes = {
  name: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
};

export const INITIAL_VIEW_STATE = {
  latitude: 48.72776,
  longitude: 4.57531,
  zoom: 17,
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

export default function Map({
  viewState,
  mapRef,
  onMouseEnter,
  onMouseLeave,
  onLoad,
  onClick,
  cursor,
  onZoom,
  padding,
  onMoveStart,
  onMove,
  interactiveLayerIds,
  style,
  mapId,
  mode,
  visibleTypes,
  activeThemes,
  PMTILES_URL,
  QA_PMTILES_URL,
  showControls,
  lastClickedCoords,
  features,
  setActiveFeature,
  activeFeature,
  enableFeatureSelector,
  setLastClickedCoords,
}) {
  return (
    <MapLibreMap
      {...viewState}
      id={mapId}
      ref={mapRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onLoad={onLoad}
      onClick={onClick}
      cursor={cursor}
      hash={true}
      onZoom={onZoom}
      mapStyle={MAP_STYLE}
      padding={padding}
      onMoveStart={onMoveStart}
      onMove={onMove}
      interactiveLayerIds={interactiveLayerIds}
      initialViewState={INITIAL_VIEW_STATE}
      style={style}
      attributionControl={false}
    >
      <ThemeSource name="base" url={QA_PMTILES_URL} />
      <ThemeSource name="buildings" url={QA_PMTILES_URL} />
      <ThemeSource name="places" url={PMTILES_URL} />
      <ThemeSource name="divisions" url={PMTILES_URL} />
      <ThemeSource name="transportation" url={PMTILES_URL} />
      <ThemeSource name="addresses" url={PMTILES_URL} />

      {enableFeatureSelector && (
        <FeatureSelector
          coordinates={lastClickedCoords}
          features={features}
          onClose={() => setLastClickedCoords(null)}
          setActiveFeature={setActiveFeature}
          activeFeature={activeFeature}
        />
      )}

      {[false, true].map((label) => {
        return layers.map((props, i) => (
          <ThemeTypeLayer
            key={`${props.theme}_${props.type}_${i}`}
            {...{
              ...props,
              color: activeThemes.includes(props.theme)
                ? props.activeColor || props.color
                : props.color,
            }}
            visible={
              visibleTypes.includes(props.type) &&
              (props.activeOnly === undefined ||
                activeThemes.includes(props.theme))
            }
            label={label && activeThemes.includes(props.theme)}
            active={activeThemes.includes(props.theme)}
            activeThemes={activeThemes}
            highlightColor={
              activeThemes.includes(props.theme)
                ? props.activeColor
                  ? props.color
                  : undefined
                : props.activeColor
            }
          />
        ));
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

      {showControls && (
        <>
          <NavigationControl position="top-right" />
          <GeolocateControl />
          <AttributionControl customAttribution='<a href="https://openstreetmap.org/copyright" target="_blank">© OpenStreetMap contributors</a>, <a href="https://overturemaps.org" target="_blank">Overture Maps Foundation</a>' />
        </>
      )}
    </MapLibreMap>
  );
}
