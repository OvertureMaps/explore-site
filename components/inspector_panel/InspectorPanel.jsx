import PropTypes from "prop-types";
import "./InspectorPanel.css";
import { getThemeConfig } from "@/components/inspector_panel/config/ThemeRegistry";
import { processActiveFeature } from "@/components/inspector_panel/utils/EntityProcessor";
import { extractPanelTitle } from "@/components/inspector_panel/utils/PanelTitleExtractor";
import PanelHeader from "@/components/inspector_panel/components/PanelHeader";
import FallbackTable from "@/components/inspector_panel/components/FallbackTable";

function InspectorPanel({
  mode,
  setFeatures,
  activeThemes,
  setActiveThemes,
  activeFeature,
  setActiveFeature,
}) {
  if (!activeFeature) {
    return;
  }

  // Process the active feature into an entity
  const entity = processActiveFeature(activeFeature);
  const theme = entity["theme"];

  // Extract panel title
  const panelTitle = extractPanelTitle(entity);

  // Handle close panel
  const handleClose = () => {
    setFeatures([]);
    setActiveFeature(null);
  };

  // Get theme configuration
  const themeConfig = getThemeConfig(theme);

  let inspectorPanel;

  if (themeConfig) {
    // Use the configured theme component
    const ThemeComponent = themeConfig.component;
    inspectorPanel = (
      <ThemeComponent
        mode={mode}
        entity={entity}
        tips={themeConfig.tips}
        activeThemes={activeThemes}
        setActiveThemes={setActiveThemes}
      />
    );
  } else {
    // Fallback for unhandled themes
    console.log("unhandled theme type");
    console.log(entity);

    inspectorPanel = (
      <FallbackTable mode={mode} entity={entity} />
    );
  }

  return (
    <div className="inspector-panel">
      <PanelHeader title={panelTitle} onClose={handleClose} />
      {inspectorPanel}
      <p>
        <a
          href="https://docs.overturemaps.org/schema/"
          target="_blank"
          rel="noreferrer noopener"
        >
          Overture Schema Reference
        </a>
      </p>
    </div>
  );
}

InspectorPanel.propTypes = {
  mode: PropTypes.string.isRequired,
  setFeatures: PropTypes.func.isRequired,
  activeThemes: PropTypes.array.isRequired,
  setActiveThemes: PropTypes.func.isRequired,
  activeFeature: PropTypes.object,
  setActiveFeature: PropTypes.func.isRequired,
};
export default InspectorPanel;
