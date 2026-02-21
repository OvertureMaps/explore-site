/**
 * Extracts the panel title from an entity, using names if available
 * @param {Object} entity - The entity object
 * @returns {string} The panel title
 */
export const extractPanelTitle = (entity) => {
  // Default title
  let panelTitle = "Inspector Panel";

  // Try to extract title from names
  if (entity["names"]) {
    try {
      const names = JSON.parse(entity["names"]);
      if (names["primary"]) {
        panelTitle = names["primary"];
      }
    } catch (e) {
      // If parsing fails, keep default title
      console.warn("Failed to parse names for panel title:", e);
    }
  }

  return panelTitle;
};
