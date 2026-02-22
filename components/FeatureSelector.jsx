import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import maplibregl from "maplibre-gl";
import PropTypes from "prop-types";
import ThemeIcon from "@/components/inspector_panel/ThemeIcon";
import FeatureTitle from "@/components/FeatureTitle";
import "@/components/FeatureSelector.css";

function PopupContent({ features, activeFeature, setActiveFeature }) {
  return (
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
  );
}

PopupContent.propTypes = {
  features: PropTypes.array.isRequired,
  activeFeature: PropTypes.object,
  setActiveFeature: PropTypes.func.isRequired,
};

export default function FeaturePopup({
  map,
  coordinates,
  features,
  onClose,
  activeFeature,
  setActiveFeature,
}) {
  const popupRef = useRef(null);
  const rootRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!map || !coordinates || features.length < 2) {
      // Remove existing popup if conditions are no longer met
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (rootRef.current) {
        const root = rootRef.current;
        rootRef.current = null;
        containerRef.current = null;
        // Defer unmount to avoid conflict with in-progress React render
        setTimeout(() => root.unmount(), 0);
      }
      return;
    }

    // Create container and React root
    const container = document.createElement("div");
    containerRef.current = container;
    const root = createRoot(container);
    rootRef.current = root;

    root.render(
      <PopupContent
        features={features}
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
      />
    );

    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: false,
    })
      .setLngLat([coordinates.longitude, coordinates.latitude])
      .setDOMContent(container)
      .addTo(map);

    popup.on("close", () => {
      onClose();
    });

    popupRef.current = popup;

    return () => {
      popup.remove();
      popupRef.current = null;
      rootRef.current = null;
      containerRef.current = null;
      // Defer unmount to avoid conflict with in-progress React render
      setTimeout(() => root.unmount(), 0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, coordinates, features]);

  // Re-render popup content when activeFeature changes
  useEffect(() => {
    if (rootRef.current && containerRef.current && coordinates && features.length >= 2) {
      rootRef.current.render(
        <PopupContent
          features={features}
          activeFeature={activeFeature}
          setActiveFeature={setActiveFeature}
        />
      );
    }
  }, [activeFeature, features, setActiveFeature, coordinates]);

  return null;
}

FeaturePopup.propTypes = {
  map: PropTypes.object,
  coordinates: PropTypes.shape({
    longitude: PropTypes.number,
    latitude: PropTypes.number,
  }),
  features: PropTypes.array.isRequired,
  onClose: PropTypes.func.isRequired,
  activeFeature: PropTypes.object,
  setActiveFeature: PropTypes.func.isRequired,
};
