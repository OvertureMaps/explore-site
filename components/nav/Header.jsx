import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import DownloadButton from "@/components/nav/DownloadButton";
import OvertureWordmark from "@/components/nav/OvertureWordmark";
import DarkModeToggle from "@/components/nav/DarkModeToggle";
import LanguageSwitcher from "@/components/nav/LanguageSwitcher";
import ShareButton from "@/components/nav/ShareButton";
import GithubButton from "@/components/nav/GithubButton";
import SearchBox from "@/components/nav/SearchBox";
import PropTypes from "prop-types";

export default function Header({ zoom, mode, setMode, setZoom, visibleTypes, language, setLanguage, inspectMode, setInspectMode, globeMode, setGlobeMode, activeFeature }) {
  const isDark = mode === "theme-dark";

  return (
    <AppBar
      position="fixed"
      elevation={3}
      sx={{
        bgcolor: isDark ? "#1e1e1e" : "#ffffff",
        color: isDark ? "#fff" : "#213547",
        zIndex: 1100,
      }}
    >
      <Toolbar variant="dense" sx={{ minHeight: 60 }}>
        <OvertureWordmark />
        <Box sx={{ flexGrow: 1 }} />
        <GithubButton mode={mode} />
        <Tooltip title="Documentation">
          <IconButton
            href="https://docs.overturemaps.org/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Documentation"
            sx={{ color: "inherit" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>docs</span>
          </IconButton>
        </Tooltip>
        <DownloadButton zoom={zoom} mode={mode} setZoom={setZoom} visibleTypes={visibleTypes} />
        <ShareButton visibleTypes={visibleTypes} inspectMode={inspectMode} activeFeature={activeFeature} />
        <Tooltip title="Report a bug">
          <IconButton
            href="https://github.com/OvertureMaps/explore-site/issues/new/choose"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Report a bug"
            sx={{ color: "inherit" }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>bug_report</span>
          </IconButton>
        </Tooltip>
        <Tooltip title="Toggle inspect mode">
          <IconButton
            onClick={() => setInspectMode(!inspectMode)}
            aria-label="Toggle inspect mode"
            sx={{
              color: inspectMode ? "#fff" : "inherit",
              bgcolor: inspectMode ? "primary.main" : "transparent",
              "&:hover": {
                bgcolor: inspectMode ? "primary.dark" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
              },
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>frame_inspect</span>
          </IconButton>
        </Tooltip>
        <Tooltip title="Toggle globe view">
          <span>
            <IconButton
              onClick={() => setGlobeMode(!globeMode)}
              disabled={zoom >= 6}
              aria-label="Toggle globe view"
              sx={{
                color: globeMode && zoom < 6 ? "#fff" : "inherit",
                bgcolor: globeMode && zoom < 6 ? "primary.main" : "transparent",
                "&:hover": {
                  bgcolor: globeMode && zoom < 6 ? "primary.dark" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"),
                },
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>globe_asia</span>
            </IconButton>
          </span>
        </Tooltip>
        <DarkModeToggle mode={mode} setMode={setMode} />
        <LanguageSwitcher language={language} setLanguage={setLanguage} zoom={zoom} />
        <SearchBox mode={mode} />
      </Toolbar>
    </AppBar>
  );
}

Header.propTypes = {
  zoom: PropTypes.number.isRequired,
  mode: PropTypes.string.isRequired,
  setMode: PropTypes.func.isRequired,
  setZoom: PropTypes.func.isRequired,
  visibleTypes: PropTypes.array.isRequired,
  language: PropTypes.string.isRequired,
  setLanguage: PropTypes.func.isRequired,
  inspectMode: PropTypes.bool.isRequired,
  setInspectMode: PropTypes.func.isRequired,
  globeMode: PropTypes.bool.isRequired,
  setGlobeMode: PropTypes.func.isRequired,
  activeFeature: PropTypes.object,
};
