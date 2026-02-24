import PropTypes from "prop-types";
import { Drawer, Tabs, Tab, Box, IconButton } from "@mui/material";
import LayersIcon from "@mui/icons-material/Layers";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LayerTree from "@/components/LayerTree";
import InspectorPanel from "@/components/inspector_panel/InspectorPanel";

const DRAWER_WIDTH = 340;

export default function SidePanel({
  mode,
  drawerOpen,
  setDrawerOpen,
  activeTab,
  setActiveTab,
  visibleTypes,
  setVisibleTypes,
  inspectMode,
  features,
  setFeatures,
  activeFeature,
  setActiveFeature,
}) {
  const isDark = mode === "theme-dark";

  return (
    <>
      {/* Toggle button — visible when drawer is closed */}
      {!drawerOpen && (
        <IconButton
          onClick={() => setDrawerOpen(true)}
          sx={{
            position: "fixed",
            left: 8,
            top: 68,
            zIndex: 1200,
            bgcolor: isDark ? "#121212" : "white",
            color: isDark ? "white" : "#333",
            boxShadow: 2,
            "&:hover": {
              bgcolor: isDark ? "#333" : "#eee",
            },
            width: 36,
            height: 36,
          }}
        >
          <LayersIcon />
        </IconButton>
      )}

      <Drawer
        variant="persistent"
        anchor="left"
        open={drawerOpen}
        sx={{
          zIndex: 1000,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            top: "60px !important",
            height: "calc(100vh - 60px)",
            zIndex: 1000,
            bgcolor: isDark ? "#121212" : "#fff",
            color: isDark ? "#fff" : "#000",
            borderRight: isDark
              ? "1px solid rgba(255,255,255,0.12)"
              : "1px solid rgba(0,0,0,0.12)",
          },
        }}
      >
        {/* Header with close button */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            px: 1,
            minHeight: 40,
          }}
        >
          <IconButton
            onClick={() => setDrawerOpen(false)}
            sx={{ color: isDark ? "white" : "#333" }}
          >
            <ChevronLeftIcon />
          </IconButton>
        </Box>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="fullWidth"
          sx={{
            minHeight: 36,
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTab-root": {
              minHeight: 36,
              textTransform: "none",
              fontFamily: "Montserrat, sans-serif",
              fontSize: 13,
              fontWeight: 500,
              color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)",
              "&.Mui-selected": {
                color: isDark ? "#fff" : "#1976d2",
              },
            },
          }}
        >
          <Tab label="Layers" value="layers" />
          <Tab label="Features" value="features" />
        </Tabs>

        {/* Tab content */}
        <Box sx={{ overflow: "auto", flex: 1 }}>
          {activeTab === "layers" && (
            <LayerTree
              visibleTypes={visibleTypes}
              setVisibleTypes={setVisibleTypes}
              inspectMode={inspectMode}
            />
          )}
          {activeTab === "features" && (
            <Box sx={{ p: 1 }}>
              {features.length > 0 ? (
                <InspectorPanel
                  mode={mode}
                  activeFeature={activeFeature}
                  setActiveFeature={setActiveFeature}
                  features={features}
                  setFeatures={setFeatures}
                />
              ) : (
                <Box
                  sx={{
                    p: 2,
                    textAlign: "center",
                    color: isDark
                      ? "rgba(255,255,255,0.5)"
                      : "rgba(0,0,0,0.4)",
                    fontFamily: "Montserrat, sans-serif",
                    fontSize: 13,
                  }}
                >
                  Click a feature on the map to inspect it.
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
}

SidePanel.propTypes = {
  mode: PropTypes.string.isRequired,
  drawerOpen: PropTypes.bool.isRequired,
  setDrawerOpen: PropTypes.func.isRequired,
  activeTab: PropTypes.string.isRequired,
  setActiveTab: PropTypes.func.isRequired,
  visibleTypes: PropTypes.array.isRequired,
  setVisibleTypes: PropTypes.func.isRequired,
  inspectMode: PropTypes.bool.isRequired,
  features: PropTypes.array.isRequired,
  setFeatures: PropTypes.func.isRequired,
  activeFeature: PropTypes.object,
  setActiveFeature: PropTypes.func.isRequired,
};
