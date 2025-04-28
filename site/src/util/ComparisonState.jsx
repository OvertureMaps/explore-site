import { useState, useMemo } from "react";
import { VERSION_OPTIONS, TWO_WEEKS_DS } from "../VersionConstants";

export function useComparisonState() {
    const [compareMode, setCompareMode] = useState(true);
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
  