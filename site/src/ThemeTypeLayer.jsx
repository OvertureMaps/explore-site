import { Layer } from "react-map-gl/maplibre";
import PropTypes from "prop-types";
import "./CustomControls.css";

const colorExpression = (color, highlightColor) => {
  return [
    "case",
    ["boolean", ["feature-state", "selected"], false],
    highlightColor || "white",
    color,
  ];
};

const ThemeTypeLayer = ({
  activeThemes,
  theme,
  type,
  color,
  highlightColor,
  point,
  line,
  polygon,
  extrusion,
  visible,
  label,
  active,
  outline,
  minzoom,
  pointSize,
  fillOutlineColor,
  labelColor,
  lineWidth,
}) => {
  return (
    <>
      {point ? (
        <Layer
          filter={["==", ["geometry-type"], "Point"]}
          id={`${theme}_${type}_point`}
          type="circle"
          source={theme}
          source-layer={type}
          paint={{
            "circle-color": colorExpression(color, highlightColor),
            "circle-radius": [
              "interpolate",
              ["exponential", 2],
              ["zoom"],
              0,
              1,
              17,
              pointSize || 6,
            ],
            "circle-opacity": active ? 1 : 0.4,
          }}
          layout={{ visibility: visible ? "visible" : "none" }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}

      {label && point ? (
        <>
          <Layer
            filter={["==", ["geometry-type"], "Point"]}
            id={`${theme}_${type}_point_label`}
            minzoom={minzoom || 17}
            type="symbol"
            source={theme}
            source-layer={type}
            paint={{
              "text-color": labelColor,
              "text-halo-color": "hsla(0, 100%, 100%, 1)",
              "text-halo-width": 1,
            }}
            layout={{
              "text-font": ["Noto Sans Regular"],
              "text-field": ["get", "@name"],
              "text-size": 10,
              visibility: visible ? "visible" : "none",
              "text-radial-offset": 0,
              "text-justify": "auto",
              "text-line-height": 1,
              "text-padding": 12,
              "text-max-width": 4,
            }}
          />
        </>
      ) : null}

      {line ? (
        <Layer
          filter={["==", ["geometry-type"], "LineString"]}
          id={`${theme}_${type}_line`}
          type="line"
          source={theme}
          source-layer={type}
          paint={{
            "line-color": colorExpression(color, highlightColor),
            "line-width": ["interpolate", ["linear"], ["zoom"], 12, 1, 13, 2],
          }}
          layout={{ visibility: visible ? "visible" : "none" }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}
      {line ? (
        <Layer
          filter={["==", ["geometry-type"], "LineString"]}
          id={`${theme}_${type}_line_click_buffer`}
          type="line"
          source={theme}
          source-layer={type}
          paint={{
            "line-opacity": 0,
            "line-color": "black",
            "line-width": ["interpolate", ["linear"], ["zoom"], 12, 6, 13, 9],
          }}
          layout={{ visibility: visible ? "visible" : "none" }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}

      {outline ? (
        <Layer
          filter={[
            "all",
            ["==", ["geometry-type"], "Polygon"],
            ["==", ["get", "has_parts"], true], // only show outline if has_parts is true
          ]}
          id={`${theme}_${type}_outline`}
          type="line"
          source={theme}
          source-layer={type}
          paint={{
            "line-color": colorExpression(color, highlightColor),
            "line-width": lineWidth || [
              "interpolate",
              ["linear"],
              ["zoom"],
              12,
              1,
              13,
              activeThemes.length > 1 ? 1 : 2,
            ],
          }}
          layout={{ visibility: visible ? "visible" : "none" }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}
      {outline ? (
        <Layer
          filter={[
            "all",
            ["==", ["geometry-type"], "Polygon"],
            ["==", ["get", "has_parts"], true], // only show outline click buffer if has_parts is true
          ]}
          id={`${theme}_${type}_outline_click_buffer`}
          type="line"
          source={theme}
          source-layer={type}
          paint={{
            "line-opacity": 0,
            "line-color": "black",
            "line-width": ["interpolate", ["linear"], ["zoom"], 12, 6, 13, 9],
          }}
          layout={{ visibility: visible ? "visible" : "none" }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}
      {label && line ? (
        <Layer
          filter={["==", ["geometry-type"], "LineString"]}
          id={`${theme}_${type}_line_label`}
          type="symbol"
          source={theme}
          source-layer={type}
          paint={{
            "text-color": labelColor,
            "text-halo-color": "hsla(0, 100%, 100%, 1)",
            "text-halo-width": 1,
          }}
          layout={{
            "text-font": ["Noto Sans Regular"],
            "text-field": ["get", "@name"],
            "text-size": 11,
            "symbol-placement": "line-center",
            visibility: visible ? "visible" : "none",
          }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}

      {polygon ? (
        <Layer
          filter={["==", ["geometry-type"], "Polygon"]}
          id={`${theme}_${type}_fill`}
          type="fill"
          source={theme}
          source-layer={type}
          paint={{
            "fill-color": colorExpression(color, highlightColor),
            "fill-opacity": active ? 0.5 : 0.5,
            "fill-outline-color": fillOutlineColor,
          }}
          layout={{ visibility: visible ? "visible" : "none" }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}
      {extrusion ? (
        <Layer
          filter={[
            "all",
            ["==", ["geometry-type"], "Polygon"],
            ["!=", ["get", "has_parts"], true], // prevent z-fighting by hiding extrusion layer
          ]}
          id={`${theme}_${type}_fill-extrusion`}
          type="fill-extrusion"
          source={theme}
          source-layer={type}
          paint={{
            "fill-extrusion-color": colorExpression(color, highlightColor),
            "fill-extrusion-opacity": active
              ? activeThemes.length > 1
                ? 0.35
                : 0.15
              : 0.15,
            "fill-extrusion-base": ["coalesce", ["get", "min_height"], 0],
            "fill-extrusion-height": ["coalesce", ["get", "height"], 0],
          }}
          layout={{ visibility: visible ? "visible" : "none" }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}
      {label && (polygon || extrusion || outline) ? (
        <Layer
          filter={["all", ["==", ["geometry-type"], "Polygon"]]}
          id={`${theme}_${type}_fill_labels`}
          type="symbol"
          source={theme}
          source-layer={type}
          paint={{
            "text-color": labelColor,
            "text-halo-color": "hsla(0, 100%, 100%, 1)",
            "text-halo-width": 1,
          }}
          layout={{
            "text-font": ["Noto Sans Regular"],
            "text-field": ["get", "@name"],
            "text-size": 11,
            visibility: visible ? "visible" : "none",
            "symbol-placement": "point",
          }}
          {...(minzoom ? { minzoom } : {})}
        />
      ) : null}
    </>
  );
};

ThemeTypeLayer.propTypes = {
  activeThemes: PropTypes.array.isRequired,
  theme: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  color: PropTypes.any.isRequired,
  highlightColor: PropTypes.any.isRequired,
  point: PropTypes.bool,
  line: PropTypes.bool,
  polygon: PropTypes.bool,
  extrusion: PropTypes.bool,
  outline: PropTypes.bool,
  active: PropTypes.bool,
  label: PropTypes.bool,
  minzoom: PropTypes.number,
  pointSize: PropTypes.number,
  fillOutlineColor: PropTypes.string,
  labelColor: PropTypes.string,
  lineWidth: PropTypes.number,
};

export default ThemeTypeLayer;
