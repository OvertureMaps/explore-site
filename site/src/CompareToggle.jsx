import { useState, useMemo, useCallback } from "react";
import CompareIcon from "@mui/icons-material/Compare";
import PropTypes from "prop-types";
import "./CompareToggle.css";
import { VERSION_OPTIONS, TWO_WEEKS_DS } from "./VersionConstants";

export function useComparisonState() {
  const [compareMode, setCompareMode] = useState(false);
  const [activeMap, setActiveMap] = useState("left");
  const [leftVersion, setLeftVersion] = useState(VERSION_OPTIONS[0]);
  const [rightVersion, setRightVersion] = useState(VERSION_OPTIONS[0]);
  const [leftQaVersion, setLeftQaVersion] = useState(TWO_WEEKS_DS[1]);
  const [rightQaVersion, setRightQaVersion] = useState(TWO_WEEKS_DS[0]);

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
    leftQaVersion,
    setLeftQaVersion,
    rightQaVersion,
    setRightQaVersion,
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
