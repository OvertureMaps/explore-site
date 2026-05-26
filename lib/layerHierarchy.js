/**
 * Minimal layer hierarchy builder for the download dialog.
 *
 * Produces a two-level theme → items tree where each item represents a unique
 * source-layer type (overture:type).  Multiple visual groups that share the
 * same source-layer type are collapsed into a single item entry.
 *
 * @module lib/layerHierarchy
 */

import { defaultLayerSpecs, groups, themes } from "@/components/map";

/** Format an overture:type string as a human-readable name. */
function typeToName(type) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Build a theme → items hierarchy from layer spec metadata and the tree
 * config JSON.  Items are deduplicated by source-layer type and ordered by
 * their first appearance across groups (sorted by group.order then item.order).
 *
 * @param {object[]} layerSpecs  Resolved layer specs with overture:* metadata
 * @param {object}   treeGroups  groups section of explore-tree.json
 * @param {object}   treeThemes  themes section of explore-tree.json
 * @returns {Array<{key: string, name: string, items: Array<{type: string, name: string}>}>}
 */
export function buildDownloadHierarchy(layerSpecs, treeGroups, treeThemes) {
  // Map item ID → source-layer type
  const itemType = {};
  for (const spec of layerSpecs) {
    const meta = spec.metadata || {};
    const itemId = meta["overture:item"];
    const type = meta["overture:type"];
    if (itemId && type && !itemType[itemId]) {
      itemType[itemId] = type;
    }
  }

  // For each theme, accumulate unique types preserving first-appearance order.
  const themeItems = {}; // themeKey → Map<type, name>

  for (const [themeKey, themeGroups] of Object.entries(treeGroups)) {
    const sortedGroups = Object.entries(themeGroups).sort(
      (a, b) => (a[1].order ?? 99) - (b[1].order ?? 99)
    );

    for (const [, groupInfo] of sortedGroups) {
      if (!groupInfo.items) continue;

      const sortedItems = Object.entries(groupInfo.items).sort(
        (a, b) => (a[1].order ?? 99) - (b[1].order ?? 99)
      );

      for (const [itemId] of sortedItems) {
        const type = itemType[itemId];
        if (!type) continue;
        if (!themeItems[themeKey]) themeItems[themeKey] = new Map();
        if (!themeItems[themeKey].has(type)) {
          themeItems[themeKey].set(type, typeToName(type));
        }
      }
    }
  }

  return Object.entries(treeThemes)
    .sort((a, b) => (a[1].order ?? 99) - (b[1].order ?? 99))
    .filter(([themeKey]) => themeItems[themeKey]?.size > 0)
    .map(([themeKey, themeInfo]) => ({
      key: themeKey,
      name: themeInfo.name || themeKey,
      items: [...themeItems[themeKey].entries()].map(([type, name]) => ({
        type,
        name,
      })),
    }));
}

/** Pre-built hierarchy for the explore (default) mode. */
export const exploreHierarchy = buildDownloadHierarchy(defaultLayerSpecs, groups, themes);
