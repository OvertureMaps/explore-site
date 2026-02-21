/**
 * Processes an activeFeature into an entity object for the inspector panel
 * @param {Object} activeFeature - The active feature from the map
 * @returns {Object} The processed entity object
 */
export const processActiveFeature = (activeFeature) => {
  if (!activeFeature) {
    return null;
  }

  return {
    theme: activeFeature.source,
    type: activeFeature.sourceLayer,
    ...activeFeature.properties,
  };
};
