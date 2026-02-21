/**
 * Creates ordered keys for entity properties with custom class/subclass hierarchy
 * @param {Object} entity - The entity object
 * @returns {Array} Array of objects with key and indented properties
 */
export const createOrderedKeys = (entity) => {
  // Get all keys except those starting with @
  const allKeys = Object.keys(entity).filter((key) => !key.startsWith("@"));

  // Create custom ordering for class/subclass hierarchy
  const orderedKeys = [];
  const processedKeys = new Set();

  // First pass: add all keys except subclass
  allKeys.forEach(key => {
    if (key !== "subclass") {
      orderedKeys.push({ key, indented: false });
      processedKeys.add(key);

      // If this is "class" and "subclass" exists, add subclass right after
      if (key === "class" && Object.prototype.hasOwnProperty.call(entity, "subclass")) {
        orderedKeys.push({ key: "subclass", indented: true });
        processedKeys.add("subclass");
      }
    }
  });

  // Second pass: add any remaining keys that weren't processed
  allKeys.forEach(key => {
    if (!processedKeys.has(key)) {
      orderedKeys.push({ key, indented: false });
    }
  });

  return orderedKeys;
};
