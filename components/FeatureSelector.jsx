import { Popup } from "react-map-gl/maplibre";
import PropTypes from "prop-types";
import ThemeIcon from "@/components/inspector_panel/ThemeIcon";
import FeatureTitle from "@/components/FeatureTitle";
import "@/components/FeatureSelector.css";

export default function FeaturePopup({
  coordinates,
  features,
  onClose,
  activeFeature,
  setActiveFeature,
}) {
  if (!coordinates || features.length < 2) return null;
  return (
    <Popup
      longitude={coordinates.longitude}
      latitude={coordinates.latitude}
      onClose={onClose}
      closeButton={true}
      closeOnClick={false}
    >
      <div className="popup-content">
        <div className="feature-selector-title">Select a feature</div>
        {features.map((feature, index) => {
          const entity = {
            theme: feature.source,
            type: feature.sourceLayer,
            ...feature.properties,
          };
          return (
            <div
              key={index}
              className={`feature-item${
                feature === activeFeature ? " active" : ""
              }`}
              onClick={() => {
                if (feature === activeFeature) {
                  setActiveFeature(null);
                } else {
                  setActiveFeature(feature);
                }
              }}
            >
              <ThemeIcon theme={entity.theme} />
              <span>
                <FeatureTitle entity={entity} />
              </span>
            </div>
          );
        })}
      </div>
    </Popup>
  );
}

FeaturePopup.propTypes = {
  coordinates: PropTypes.shape({
    longitude: PropTypes.number,
    latitude: PropTypes.number,
  }),
  features: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  activeFeature: PropTypes.object,
  setActiveFeature: PropTypes.func.isRequired,
};
