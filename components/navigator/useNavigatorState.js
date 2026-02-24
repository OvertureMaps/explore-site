import { useState, useEffect } from "react";

export function useNavigatorState(initialOpen = false) {
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("navigatorOpen");
    if (stored !== null) {
      setNavigatorOpen(JSON.parse(stored));
    } else {
      setNavigatorOpen(!initialOpen);
    }
  }, [initialOpen]);

  useEffect(() => {
    localStorage.setItem("navigatorOpen", JSON.stringify(navigatorOpen));
  }, [navigatorOpen]);

  return [navigatorOpen, setNavigatorOpen];
}
