import { useState, useMemo, useCallback } from "react";
import CompareIcon from "@mui/icons-material/Compare";
import PropTypes from "prop-types";
import "./CompareToggle.css";

// TODO: Get from manifest once the generation is finalized!
export const VERSION_OPTIONS = [
  "2024-12-18.0",
  "2024-11-13.0",
  "2024-10-23.0",
  "2024-09-18.0",
  "2024-08-20.0",
  "2024-07-22.0",
];

export function useComparisonState() {
  const [compareMode, setCompareMode] = useState(false);
  const [activeMap, setActiveMap] = useState("left");
  const [leftVersion, setLeftVersion] = useState(VERSION_OPTIONS[0]);
  const [rightVersion, setRightVersion] = useState(VERSION_OPTIONS[0]);

  const leftMapStyle = useMemo(
    () => ({
      position: "absolute",
      width: compareMode ? "calc(50vw - 2px)" : "100%",
      height: "calc(100vh - 60px)",
    }),
    [compareMode]
  );

  const rightMapStyle = useMemo(
    () => ({
      position: "absolute",
      width: "calc(50vw - 2px)",
      right: 0,
      height: "calc(100vh - 60px)",
      display: compareMode ? "block" : "none",
    }),
    [compareMode]
  );

  return {
    compareMode,
    setCompareMode,
    activeMap,
    setActiveMap,
    leftMapStyle,
    rightMapStyle,
    leftVersion,
    setLeftVersion,
    rightVersion,
    setRightVersion,
  };
}

export default function CompareToggle({ compareMode, setCompareMode }) {
  return (
    <button
      className="compare-toggle"
      onClick={() => setCompareMode(!compareMode)}
      title={compareMode ? "Disable compare mode" : "Enable compare mode"}
    >
      <CompareIcon className="compare-icon" />
    </button>
  );
}

CompareToggle.propTypes = {
  compareMode: PropTypes.bool.isRequired,
  setCompareMode: PropTypes.func.isRequired,
};
