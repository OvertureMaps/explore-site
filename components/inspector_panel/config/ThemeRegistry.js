import ThemePanel from "@/components/inspector_panel/ThemePanel";
import {
  BASE_TIPS,
  BUILDING_TIPS,
  DIVISION_TIPS,
  PLACES_TIPS,
  TRANSPORTATION_TIPS,
  ADDRESSES_TIPS,
} from "@/components/inspector_panel/TipLibrary";

export const THEME_CONFIG = {
  base: {
    component: ThemePanel,
    tips: BASE_TIPS,
  },
  buildings: {
    component: ThemePanel,
    tips: BUILDING_TIPS,
  },
  divisions: {
    component: ThemePanel,
    tips: DIVISION_TIPS,
  },
  places: {
    component: ThemePanel,
    tips: PLACES_TIPS,
  },
  transportation: {
    component: ThemePanel,
    tips: TRANSPORTATION_TIPS,
  },
  addresses: {
    component: ThemePanel,
    tips: ADDRESSES_TIPS,
  },
};

export const getThemeConfig = (theme) => {
  return THEME_CONFIG[theme] || null;
};

export const isKnownTheme = (theme) => {
  return theme in THEME_CONFIG;
};
