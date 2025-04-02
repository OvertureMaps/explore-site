import { useState, useEffect } from "react";
import LayerIcon from "./icons/icon-layers.svg?react";
import "./ThemeSelector.css";
import { layers } from "./Layers";
import { format } from "./util/TextUtil";
import {
  Box,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  Popper,
  Paper,
} from "@mui/material";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";

import { ThemeProvider, createTheme } from "@mui/material/styles";

// Should convert this logic to be dynamic once manifests are a thing!
function themeFromType (type) {
  switch (type) {
    case "boundary":
    case "division":
    case "division_area":
    case "division_boundary":
      return 'divisions';

    case "land":
    case "land_cover":
    case "land_use":
    case "water":
    case "infrastructure":
      return "base";

    case "segment":
    case "connector":
      return "transportation";

    case "building":
    case "building_part":
      return "buildings"

    case "place":
      return "places";

    case "address":
      return "addresses"
  }
  return '';
}

const muiTheme = createTheme({
  typography: {
    allVariants: {
      fontFamily: `Montserrat, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans,sans-serif`,
      fontSize: 14,
      fontWeightLight: 300,
      fontWeightRegular: 400,
      fontWeightMedium: 500,
    },
  },
});

const ThemeSelector = ({
  mode,
  visibleTypes,
  setVisibleTypes,
  activeThemes,
  setActiveThemes,
  entity,
  themeRef,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const handleClick = (event) => {
    if (anchorEl) {
      setAnchorEl(null);
    } else {
      setAnchorEl(event.currentTarget);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const [selectedThemes, setSelectedThemes] = useState({});
  const [selectedTypes, setSelectedTypesState] = useState({});

  useEffect(() => {
    const newSelectedThemes = {};
    const newSelectedTypes = {};

    layers.forEach((layer) => {
      if (!newSelectedThemes[layer.theme]) {
        newSelectedThemes[layer.theme] = true;
      }
      newSelectedTypes[layer.type] = true;
    });

    setSelectedThemes(newSelectedThemes);
    setSelectedTypesState(newSelectedTypes);
    updateVisibleTypes(newSelectedTypes);
  }, []);

  useEffect(() => {
    const newSelectedTypes = {};
    const newSelectedThemes = {};

    visibleTypes.forEach((type) => {
      newSelectedTypes[type] = true;
      newSelectedThemes[themeFromType(type)] = true;
    });

    setSelectedTypesState(newSelectedTypes);
    setSelectedThemes(newSelectedThemes);
  }, [visibleTypes]);

  const handleThemeChange = (theme) => {
    const newSelectedThemes = {
      ...selectedThemes,
      [theme]: !selectedThemes[theme],
    };
    setSelectedThemes(newSelectedThemes);

    const newSelectedTypes = { ...selectedTypes };
    layers
      .filter((layer) => layer.theme === theme)
      .forEach((layer) => {
        newSelectedTypes[layer.type] = !selectedThemes[theme];
      });

    setSelectedTypesState(newSelectedTypes);
    updateVisibleTypes(newSelectedTypes);
  };

  const handleTypeChange = (type) => {
    const newSelectedTypes = { ...selectedTypes, [type]: !selectedTypes[type] };
    setSelectedTypesState(newSelectedTypes);
    updateVisibleTypes(newSelectedTypes);
  };

  const updateVisibleTypes = (newSelectedTypes) => {
    const visible = Object.keys(newSelectedTypes).filter(
      (type) => newSelectedTypes[type]
    );
    setVisibleTypes(visible);
  };

  const filterUniqueByType = (array) => {
    const seenTypes = new Set();
    return array.filter((item) => {
      if (seenTypes.has(item.type)) {
        return false;
      } else {
        seenTypes.add(item.type);
        return true;
      }
    });
  };

  const [expandedThemes, setExpandedThemes] = useState(activeThemes);

  const renderExpandIcon = (theme, types) => {
    if (types.length === 1) {
      return <></>;
    } else {
      return (
        <button
          className={`expand-icon`}
          onClick={() => {
            if (expandedThemes.includes(theme)) {
              setExpandedThemes(expandedThemes.filter((t) => t !== theme));
            } else {
              setExpandedThemes(expandedThemes.concat(theme));
            }
          }}
        >
          {expandedThemes.includes(theme) ? (
            <ExpandLessIcon />
          ) : (
            <ExpandMoreIcon />
          )}
        </button>
      );
    }
  };

  const renderPinThemeIcon = (theme, mode) => {
    const props = {
      sx: {
        "&:hover": {
          cursor: "pointer",
        },
        color: mode === "theme-dark" ? "white" : "black",
      },
    };

    return (
      <IconButton
        className={`${
          theme === "divisions" ? "tour-layers-pins" : ""
        } pin-button`}
        onClick={() => {
          if (activeThemes.includes(theme)) {
            setActiveThemes(activeThemes.filter((t) => t !== theme));
          } else {
            setActiveThemes(activeThemes.concat(theme));
          }
        }}
        sx={{
          marginTop: "-2px",
        }}
      >
        {activeThemes.includes(theme) ? (
          <PushPinIcon {...props} />
        ) : (
          <PushPinOutlinedIcon {...props} />
        )}
      </IconButton>
    );
  };

  const renderCheckboxes = () => {
    const themes = [...new Set(layers.map((layer) => layer.theme))];

    return (
      <ThemeProvider theme={muiTheme}>
        <Box p={1} className sx={{ padding: "0px" }}>
          {themes.map((theme) => {
            const types = filterUniqueByType(
              layers.filter((layer) => layer.theme === theme)
            );

            const children = types.map((t) => selectedTypes[t.type]);

            const expandGridSize = types.length > 1 ? 2 : 0;

            return (
              <Grid
                container
                className={`theme-box ${
                  mode === "theme-dark" ? "dark" : "light"
                }`}
                key={theme}
                sx={{ paddingLeft: "5px" }}
                width={220}
              >
                <Grid
                  className={
                    theme === "divisions" ? "tour-layers-checkboxes" : ""
                  }
                  item
                  xs={10 - expandGridSize}
                >
                  <div>
                    <FormControlLabel
                      label={format(theme)}
                      className="theme-selector-checkbox"
                      sx={{
                        height: "16px",
                        marginBottom: "4px",
                        marginTop: "10px",
                      }}
                      control={
                        <Checkbox
                          size="small"
                          sx={{ padding: "2px", ml: 1 }}
                          checked={
                            selectedThemes[theme] && children.includes(true)
                          }
                          indeterminate={
                            children.includes(true) && children.includes(false)
                          }
                          onChange={() => handleThemeChange(theme)}
                        />
                      }
                    />
                  </div>
                  {types.length > 1 &&
                    (expandedThemes.includes(theme) ? (
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          ml: 2,
                          padding: "0px",
                        }}
                      >
                        {types.map((layer) => (
                          <FormControlLabel
                            label={format(layer.type)}
                            className={`type-selector-checkbox ${
                              mode === "theme-dark" ? "dark" : "light"
                            }`}
                            key={`${layer.theme}-${layer.type}`}
                            control={
                              <Checkbox
                                sx={{ padding: "2px" }}
                                size="small"
                                checked={selectedTypes[layer.type]}
                                onChange={() => handleTypeChange(layer.type)}
                              />
                            }
                          />
                        ))}
                      </Box>
                    ) : (
                      <></>
                    ))}
                </Grid>

                <Grid item xs={expandGridSize}>
                  {renderExpandIcon(theme, types)}
                </Grid>
                <Grid item xs={2}>
                  {renderPinThemeIcon(theme, mode)}
                </Grid>
              </Grid>
            );
          })}
        </Box>
      </ThemeProvider>
    );
  };

  const open = Boolean(anchorEl);
  const id = open ? "theme-selector-popover" : undefined;

  return (
    <div className={`theme-selector tour-layers ${open ? "active" : ""}`}>
      <div ref={themeRef} className="layer-control" onClick={handleClick}>
        <LayerIcon
          className={`icon-layers ${
            mode === "theme-dark" ? "icon-layers-dark" : ""
          }`}
        />
      </div>
      <Popper
        className={` ${mode} theme-selector-popover`}
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        placement="right-start"
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
      >
        <Paper sx={{ borderRadius: "0px" }}>{renderCheckboxes()}</Paper>
      </Popper>
    </div>
  );
};

export default ThemeSelector;
