import PropTypes from "prop-types";
import { SimpleTreeView } from "@mui/x-tree-view/SimpleTreeView";
import { TreeItem } from "@mui/x-tree-view/TreeItem";
import { Checkbox, Box } from "@mui/material";
import SquareIcon from "@mui/icons-material/Square";
import HorizontalRuleIcon from "@mui/icons-material/HorizontalRule";
import CircleIcon from "@mui/icons-material/Circle";
import AbcIcon from "@mui/icons-material/Abc";
import PlaceIcon from "@mui/icons-material/Place";
import variables from "@/lib/map-styles/variables.json";

const GEOMETRY_ICONS = {
  polygon: SquareIcon,
  line: HorizontalRuleIcon,
  point: CircleIcon,
  label: AbcIcon,
  symbol: PlaceIcon,
};

function GeometryIcon({ geometryType, color }) {
  const Icon = GEOMETRY_ICONS[geometryType] || CircleIcon;
  return (
    <Icon
      sx={{
        fontSize: 16,
        color: color || "grey",
        mr: 0.5,
        verticalAlign: "middle",
      }}
    />
  );
}

GeometryIcon.propTypes = {
  geometryType: PropTypes.string,
  color: PropTypes.string,
};

function getIconColor(typeData, inspectMode) {
  if (inspectMode && typeData.inspectColor) {
    return typeData.inspectColor;
  }
  const color = typeData.color;
  if (typeof color === "string") return color;
  // For expression-based colors (like land_cover), use inspectColor or a fallback
  if (typeData.inspectColor) return typeData.inspectColor;
  return "grey";
}

export default function LayerTree({
  visibleTypes,
  setVisibleTypes,
  inspectMode,
}) {
  const themeEntries = Object.entries(variables)
    .filter(([k]) => k !== "global")
    .sort((a, b) => (a[1]._meta?.order ?? 99) - (b[1]._meta?.order ?? 99));

  const isTypeVisible = (type) => visibleTypes.includes(type);

  const getThemeTypes = (themeData) =>
    Object.entries(themeData)
      .filter(([k]) => k !== "_meta")
      .sort((a, b) => (a[1].order ?? 99) - (b[1].order ?? 99));

  const isThemeChecked = (themeData) => {
    const types = getThemeTypes(themeData);
    return types.every(([typeName]) => isTypeVisible(typeName));
  };

  const isThemeIndeterminate = (themeData) => {
    const types = getThemeTypes(themeData);
    const some = types.some(([typeName]) => isTypeVisible(typeName));
    const all = types.every(([typeName]) => isTypeVisible(typeName));
    return some && !all;
  };

  const handleThemeToggle = (themeData) => {
    const types = getThemeTypes(themeData);
    const allVisible = types.every(([typeName]) => isTypeVisible(typeName));

    if (allVisible) {
      // Uncheck all types in this theme
      const typeNames = types.map(([name]) => name);
      setVisibleTypes((prev) => prev.filter((t) => !typeNames.includes(t)));
    } else {
      // Check all types in this theme
      const typeNames = types.map(([name]) => name);
      setVisibleTypes((prev) => [...new Set([...prev, ...typeNames])]);
    }
  };

  const handleTypeToggle = (typeName) => {
    setVisibleTypes((prev) =>
      prev.includes(typeName)
        ? prev.filter((t) => t !== typeName)
        : [...prev, typeName]
    );
  };

  return (
    <SimpleTreeView
      sx={{ py: 1 }}
    >
      {themeEntries.map(([themeName, themeData]) => {
        const types = getThemeTypes(themeData);
        const displayName = themeData._meta?.displayName || themeName;

        return (
          <TreeItem
            key={themeName}
            itemId={themeName}
            label={
              <Box
                sx={{ display: "flex", alignItems: "center" }}
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  size="small"
                  sx={{ p: 0, mr: 0.5 }}
                  checked={isThemeChecked(themeData)}
                  indeterminate={isThemeIndeterminate(themeData)}
                  onChange={() => handleThemeToggle(themeData)}
                />
                <span>{displayName}</span>
              </Box>
            }
          >
            {types.map(([typeName, typeData]) => (
              <TreeItem
                key={typeName}
                itemId={`${themeName}/${typeName}`}
                label={
                  <Box
                    sx={{ display: "flex", alignItems: "center" }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      size="small"
                      sx={{ p: 0, mr: 0.5 }}
                      checked={isTypeVisible(typeName)}
                      onChange={() => handleTypeToggle(typeName)}
                    />
                    <GeometryIcon
                      geometryType={typeData.geometryType}
                      color={getIconColor(typeData, inspectMode)}
                    />
                    <span>{typeData.displayName || typeName}</span>
                  </Box>
                }
              >
                {typeData.subtypes &&
                  typeData.subtypes.map((sub) => (
                    <TreeItem
                      key={sub.name}
                      itemId={`${themeName}/${typeName}/${sub.name}`}
                      label={
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <GeometryIcon
                            geometryType={typeData.geometryType}
                            color={sub.color}
                          />
                          <span>{sub.name}</span>
                        </Box>
                      }
                    />
                  ))}
              </TreeItem>
            ))}
          </TreeItem>
        );
      })}
    </SimpleTreeView>
  );
}

LayerTree.propTypes = {
  visibleTypes: PropTypes.array.isRequired,
  setVisibleTypes: PropTypes.func.isRequired,
  inspectMode: PropTypes.bool.isRequired,
};
