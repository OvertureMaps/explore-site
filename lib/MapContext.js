"use client";

import { createContext, useContext } from "react";

const MapContext = createContext(null);

export function useMapInstance() {
  return useContext(MapContext);
}

export default MapContext;
