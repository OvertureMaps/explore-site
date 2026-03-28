import { useState } from "react";
import PropTypes from "prop-types";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { Checkbox, Box, IconButton, Tooltip } from "@mui/material";
import SquareIcon from "@mui/icons-material/Square";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import CircleIcon from "@mui/icons-material/Circle";
import AbcIcon from "@mui/icons-material/Abc";
import PlaceIcon from "@mui/icons-material/Place";
import UnfoldMoreIcon from "@mui/icons-material/UnfoldMore";
import UnfoldLessIcon from "@mui/icons-material/UnfoldLess";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { themes, groups, defaultLayerSpecs, inspectThemes, inspectGroups, inspectLayerSpecs } from "@/components/map";

const COLOR_PROPERTY = {
  circle: "circle-color",
  line: "line-color",
  fill: "fill-color",
  "fill-extrusion": "fill-extrusion-color",
  symbol: "text-color",
};

const GEOMETRY_ICONS = {
  polygon: SquareIcon,
  line: HorizontalRuleIcon,
  point: CircleIcon,
  label: AbcIcon,
  symbol: PlaceIcon,
};

const LAYER_TYPE_TO_GEOMETRY = {
  fill: "polygon",
  "fill-extrusion": "polygon",
  line: "line",
  circle: "point",
  symbol: "label",
};

function getGeometryType(spec) {
  if (spec.type === "symbol" && spec.layout?.["icon-image"]) {
    return "symbol";
  }
  return LAYER_TYPE_TO_GEOMETRY[spec.type] || "polygon";
}

function GeometryIcon({ geometryType, color, iconImage }) {
  if (iconImage && typeof iconImage === "string") {
    return (
      <img
        src={`/icons/${iconImage}.svg`}
        alt={iconImage}
        style={{
          width: 18,
          height: 18,
          marginRight: 4,
          verticalAlign: "middle",
        }}
      />
    );
  }
  const Icon = GEOMETRY_ICONS[geometryType] || CircleIcon;
  const isLine = geometryType === "line";
  return (
    <Icon
      sx={{
        fontSize: 18,
        color: color || "grey",
        mr: 0.5,
        verticalAlign: "middle",
        ...(isLine && { strokeWidth: 2, stroke: color || "grey" }),
      }}
    />
  );
}

GeometryIcon.propTypes = {
  geometryType: PropTypes.string,
  color: PropTypes.string,
  iconImage: PropTypes.string,
};

function ZoomBadge({ minzoom, maxzoom }) {
  let label;
  if (maxzoom !== null && maxzoom !== undefined && minzoom > 0) {
    label = `z${minzoom}–${maxzoom}`;
  } else if (maxzoom !== null && maxzoom !== undefined) {
    label = `z0–${maxzoom}`;
  } else {
    label = `z${minzoom}+`;
  }
  return (
    <span
      style={{
        marginLeft: 4,
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1,
        padding: "1px 4px",
        borderRadius: 3,
        backgroundColor: "rgba(128,128,128,0.2)",
        color: "inherit",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

ZoomBadge.propTypes = {
  minzoom: PropTypes.number.isRequired,
};

// Evaluate a MapLibre step expression at a given zoom level, or return the
// value directly if it is already a number.
function evalAtZoom(expr, zoom) {
  if (typeof expr === "number") return expr;
  if (!Array.isArray(expr) || expr[0] !== "step") return null;
  // ["step", input, default, stop1, val1, stop2, val2, ...]
  let value = expr[2];
  for (let i = 3; i + 1 < expr.length; i += 2) {
    if (zoom >= expr[i]) value = expr[i + 1];
  }
  return value;
}

// Build tooltip lines describing each zoom-based confidence threshold step.
function buildStepTooltip(expr) {
  if (typeof expr === "number") return `confidence >= ${expr.toFixed(2)} at all zooms`;
  if (!Array.isArray(expr) || expr[0] !== "step") return null;
  // ["step", input, default, stop1, val1, stop2, val2, ...]
  const stops = [];
  for (let i = 3; i + 1 < expr.length; i += 2) {
    stops.push([expr[i], expr[i + 1]]);
  }
  const lines = [`z<${stops[0][0]}: >=${expr[2].toFixed(2)}`];
  for (let i = 0; i < stops.length; i++) {
    const nextZoom = stops[i + 1]?.[0];
    const zLabel = nextZoom !== undefined ? `z${stops[i][0]}–${nextZoom - 1}` : `z${stops[i][0]}+`;
    lines.push(`${zLabel}: >=${stops[i][1].toFixed(2)}`);
  }
  return lines.join("\n");
}

const BADGE_STYLE = {
  marginLeft: 4,
  fontSize: 10,
  fontWeight: 600,
  lineHeight: 1,
  padding: "1px 4px",
  borderRadius: 3,
  backgroundColor: "rgba(128,128,128,0.2)",
  color: "inherit",
  whiteSpace: "nowrap",
};

function ConfidenceBadge({ threshold, zoom }) {
  const value = evalAtZoom(threshold, Math.floor(zoom));
  const label = value !== null ? `>${value.toFixed(2)}` : ">0.90";
  return <span style={BADGE_STYLE}>{label}</span>;
}

function ConfidenceBadgeWithInfo({ threshold, zoom }) {
  const value = evalAtZoom(threshold, Math.floor(zoom));
  const label = value !== null ? `>${value.toFixed(2)}` : ">0.90";
  const tooltipText = buildStepTooltip(threshold);
  return (
    <Tooltip
      title={<span style={{ whiteSpace: "pre-line", fontSize: 11 }}>{tooltipText}</span>}
      placement="right"
      arrow
    >
      <span style={{ ...BADGE_STYLE, cursor: "default", display: "inline-flex", alignItems: "center", gap: 2 }}>
        {label}
        <InfoOutlinedIcon style={{ fontSize: 13, opacity: 0.6 }} />
      </span>
    </Tooltip>
  );
}

// Extract the confidence threshold expression (number or step array) from a
// filter, or return null if no confidence condition is present.
function extractConfidenceThreshold(filter) {
  if (!Array.isArray(filter)) return null;
  if (filter[0] === ">=" && Array.isArray(filter[1]) && filter[1][1] === "confidence") {
    return filter[2];
  }
  for (const item of filter) {
    if (Array.isArray(item)) {
      const result = extractConfidenceThreshold(item);
      if (result !== null) return result;
    }
  }
  return null;
}

// Build hierarchical data: theme → group → items
// Items come from tree config, enriched with layer spec metadata
function buildHierarchy(layerSpecs, treeGroups, treeThemes) {
  // Scan layer specs to find which items actually have layers and their geometry types
  const itemMeta = {};
  for (const spec of layerSpecs) {
    const meta = spec.metadata || {};
    const itemId = meta["overture:item"];
    const theme = meta["overture:theme"];
    const type = meta["overture:type"];
    if (!itemId) continue;

    const specMinZoom = spec.minzoom ?? 0;
    const specMaxZoom = spec.maxzoom ?? null;

    if (!itemMeta[itemId]) {
      itemMeta[itemId] = {
        theme,
        type,
        selectable: meta["overture:selectable"] !== false,
        geometryType: getGeometryType(spec),
        minzoom: specMinZoom,
        maxzoom: specMaxZoom,
        confidenceThreshold: extractConfidenceThreshold(spec.filter),
        iconImage: spec.layout?.["icon-image"] || null,
      };
    } else {
      if (meta["overture:selectable"] !== false) {
        itemMeta[itemId].selectable = true;
      }
      itemMeta[itemId].minzoom = Math.min(itemMeta[itemId].minzoom, specMinZoom);
      if (specMaxZoom !== null) {
        itemMeta[itemId].maxzoom = itemMeta[itemId].maxzoom !== null
          ? Math.max(itemMeta[itemId].maxzoom, specMaxZoom)
          : specMaxZoom;
      }
    }
  }

  // Build theme → groups → items structure
  const themeMap = {};

  for (const [themeKey, themeGroups] of Object.entries(treeGroups)) {
    for (const [groupKey, groupInfo] of Object.entries(themeGroups)) {
      if (!groupInfo.items) continue;

      if (!themeMap[themeKey]) {
        themeMap[themeKey] = { groups: [] };
      }

    // Build items list from the group's items config
      const items = Object.entries(groupInfo.items)
        .filter(([itemId]) => itemMeta[itemId]) // Only include items with actual layers
        .sort((a, b) => (a[1].order ?? 99) - (b[1].order ?? 99))
        .map(([itemId, itemInfo]) => ({
          id: itemId,
          name: itemInfo.name || itemId,
          order: itemInfo.order ?? 99,
          ...itemMeta[itemId],
        }));

      if (items.length > 0) {
        themeMap[themeKey].groups.push({
          key: groupKey,
          name: groupInfo.name || groupKey,
          order: groupInfo.order ?? 99,
          items,
        });
      }
    }
  }

  // Sort groups within each theme
  for (const theme of Object.values(themeMap)) {
    theme.groups.sort((a, b) => a.order - b.order);
  }

  // Build sorted theme list
  return Object.entries(treeThemes)
    .sort((a, b) => (a[1].order ?? 99) - (b[1].order ?? 99))
    .filter(([themeKey]) => themeMap[themeKey]?.groups.length > 0)
    .map(([themeKey, themeInfo]) => ({
      key: themeKey,
      name: themeInfo.name || themeKey,
      groups: themeMap[themeKey].groups,
    }));
}

const exploreHierarchy = buildHierarchy(defaultLayerSpecs, groups, themes);
const inspectHierarchy = buildHierarchy(inspectLayerSpecs, inspectGroups, inspectThemes);

// All expandable node IDs (themes + multi-item groups)
function getExpandableIds(h) {
  return h.flatMap((t) => [
    `theme:${t.key}`,
    ...t.groups.filter((g) => g.items.length > 1).map((g) => g.key),
  ]);
}

const exploreExpandableIds = getExpandableIds(exploreHierarchy);
const inspectExpandableIds = getExpandableIds(inspectHierarchy);

// Extract a representative color string from a paint value (string or expression).
// Returns the last color found, which is typically the fallback/default in
// match/case expressions and the most representative for swatches.
function extractColorFromPaint(val) {
  if (typeof val === "string") return val;
  if (!Array.isArray(val)) return null;
  let found = null;
  for (const item of val) {
    if (typeof item === "string" && (item.startsWith("#") || item.startsWith("hsl") || item.startsWith("rgb"))) {
      found = item;
    }
    if (Array.isArray(item)) {
      const nested = extractColorFromPaint(item);
      if (nested) found = nested;
    }
  }
  return found;
}

// Pre-compute item colors from resolved layer specs
const itemColorMap = {};
for (const spec of [...defaultLayerSpecs, ...inspectLayerSpecs]) {
  const meta = spec.metadata || {};
  const itemId = meta["overture:item"];
  if (!itemId || itemColorMap[itemId]) continue;
  const colorProp = COLOR_PROPERTY[spec.type];
  if (!colorProp) continue;
  const color = extractColorFromPaint(spec.paint?.[colorProp]);
  if (color) {
    itemColorMap[itemId] = color;
  }
}

function getIconColor(itemId) {
  return itemColorMap[itemId] || "grey";
}

export default function LayerTree({
  visibleTypes,
  setVisibleTypes,
  defaultVisibleTypes,
  inspectMode,
  zoom,
}) {
  const hierarchy = inspectMode ? inspectHierarchy : exploreHierarchy;
  const allExpandableIds = inspectMode ? inspectExpandableIds : exploreExpandableIds;
  const [expandedItems, setExpandedItems] = useState([]);

  const isItemVisible = (itemId) => visibleTypes.includes(itemId);

  // Collect all selectable item IDs for a group
  const getGroupItemIds = (group) =>
    group.items.filter((i) => i.selectable).map((i) => i.id);

  // Collect all selectable item IDs for a theme
  const getThemeItemIds = (themeEntry) =>
    themeEntry.groups.flatMap((g) => getGroupItemIds(g));

  // Checkbox state helpers
  const isAllVisible = (itemIds) =>
    itemIds.length > 0 && itemIds.every((id) => isItemVisible(id));

  const isSomeVisible = (itemIds) =>
    itemIds.some((id) => isItemVisible(id));

  const isIndeterminate = (itemIds) => {
    const some = isSomeVisible(itemIds);
    const all = isAllVisible(itemIds);
    return some && !all;
  };

  // Toggle a set of item IDs on/off
  const toggleItems = (itemIds) => {
    const allVisible = isAllVisible(itemIds);
    if (allVisible) {
      setVisibleTypes((prev) => prev.filter((v) => !itemIds.includes(v)));
    } else {
      setVisibleTypes((prev) => [...new Set([...prev, ...itemIds])]);
    }
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", px: 1, pt: 0.5 }}>
        <IconButton
          size="small"
          onClick={() => setExpandedItems(allExpandableIds)}
          title="Expand all"
          sx={{ p: 0.5 }}
        >
          <UnfoldMoreIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => setExpandedItems([])}
          title="Collapse all"
          sx={{ p: 0.5 }}
        >
          <UnfoldLessIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => {
            setVisibleTypes(defaultVisibleTypes);
            setExpandedItems([]);
          }}
          title="Reset to defaults"
          sx={{ p: 0.5 }}
        >
          <RestartAltIcon fontSize="small" />
        </IconButton>
      </Box>
      <SimpleTreeView
        sx={{ py: 1 }}
        expandedItems={expandedItems}
        onExpandedItemsChange={(event, ids) => setExpandedItems(ids)}
      >
      {hierarchy.map((themeEntry) => {
        const themeItemIds = getThemeItemIds(themeEntry);
        const themeDisabled = themeItemIds.length === 0;

        return (
          <TreeItem
            key={themeEntry.key}
            itemId={`theme:${themeEntry.key}`}
            label={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  fontSize: 16,
                  opacity: themeDisabled ? 0.38 : 1,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  size="small"
                  sx={{ p: 0, mr: 0.5, color: "#000", "&.Mui-checked": { color: "#000" }, "&.MuiCheckbox-indeterminate": { color: "#000" } }}
                  checked={isAllVisible(themeItemIds)}
                  indeterminate={isIndeterminate(themeItemIds)}
                  onChange={() => toggleItems(themeItemIds)}
                  disabled={themeDisabled}
                />
                <span>{themeEntry.name}</span>
              </Box>
            }
          >
            {themeEntry.groups.map((group) => {
              const groupItemIds = getGroupItemIds(group);
              const groupDisabled = groupItemIds.length === 0;
              const singleItem = group.items.length === 1;

              // Single-item group: render as a leaf node (no expand)
              if (singleItem) {
                const item = group.items[0];
                const iconColor = getIconColor(item.id);
                const zoomDisabled = item.minzoom > 0 && Math.floor(zoom) < item.minzoom;

                return (
                  <TreeItem
                    key={group.key}
                    itemId={group.key}
                    label={
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          fontSize: 15,
                          opacity: zoomDisabled ? 0.4 : 1,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          size="small"
                          sx={{ p: 0, mr: 0.5, color: "#000", "&.Mui-checked": { color: "#000" } }}
                          checked={isItemVisible(item.id)}
                          onChange={() => toggleItems([item.id])}
                          disabled={!item.selectable}
                        />
                        <GeometryIcon
                          geometryType={item.geometryType}
                          color={iconColor}
                          iconImage={item.iconImage}
                        />
                        <span>{group.name}</span>
                        {item.confidenceThreshold !== null && <ConfidenceBadge threshold={item.confidenceThreshold} zoom={zoom} />}
                        {(item.minzoom > 0 || item.maxzoom != null) && <ZoomBadge minzoom={item.minzoom} maxzoom={item.maxzoom} />}
                      </Box>
                    }
                  />
                );
              }

              // Multi-item group: expandable with child items
              return (
                <TreeItem
                  key={group.key}
                  itemId={group.key}
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        fontSize: 15,
                        opacity: groupDisabled ? 0.38 : 1,
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        size="small"
                        sx={{ p: 0, mr: 0.5, color: "#000", "&.Mui-checked": { color: "#000" }, "&.MuiCheckbox-indeterminate": { color: "#000" } }}
                        checked={isAllVisible(groupItemIds)}
                        indeterminate={isIndeterminate(groupItemIds)}
                        onChange={() => toggleItems(groupItemIds)}
                        disabled={groupDisabled}
                      />
                      <span>{group.name}</span>
                      {group.items.every((i) => i.confidenceThreshold !== null) && <ConfidenceBadgeWithInfo threshold={group.items[0].confidenceThreshold} zoom={zoom} />}
                    </Box>
                  }
                >
                  {group.items.map((item) => {
                    const iconColor = getIconColor(item.id);
                    const zoomDisabled = item.minzoom > 0 && Math.floor(zoom) < item.minzoom;

                    return (
                      <TreeItem
                        key={item.id}
                        itemId={`${group.key}/${item.id}`}
                        label={
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              fontSize: 14,
                              opacity: zoomDisabled ? 0.4 : 1,
                            }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Checkbox
                              size="small"
                              sx={{ p: 0, mr: 0.5, color: "#000", "&.Mui-checked": { color: "#000" } }}
                              checked={isItemVisible(item.id)}
                              onChange={() => toggleItems([item.id])}
                              disabled={!item.selectable}
                            />
                            <GeometryIcon
                              geometryType={item.geometryType}
                              color={iconColor}
                              iconImage={item.iconImage}
                            />
                            <span>{item.name}</span>
                            {item.confidenceThreshold !== null && <ConfidenceBadge threshold={item.confidenceThreshold} zoom={zoom} />}
                            {(item.minzoom > 0 || item.maxzoom != null) && <ZoomBadge minzoom={item.minzoom} maxzoom={item.maxzoom} />}
                          </Box>
                        }
                      />
                    );
                  })}
                </TreeItem>
              );
            })}
          </TreeItem>
        );
      })}
    </SimpleTreeView>
    </>
  );
}

LayerTree.propTypes = {
  visibleTypes: PropTypes.array.isRequired,
  setVisibleTypes: PropTypes.func.isRequired,
  defaultVisibleTypes: PropTypes.array.isRequired,
  inspectMode: PropTypes.bool.isRequired,
  zoom: PropTypes.number.isRequired,
};
