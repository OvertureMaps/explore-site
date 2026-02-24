import { createTheme } from "@mui/material";

const BACKGROUND_DARK = "#121212";
const BACKGROUND_LIGHT = "#ffffff";

export const getTheme = () => {
  const theme = localStorage.getItem("theme");
  if (theme) {
    return theme;
  }

  const prefersLightTheme = window.matchMedia("(prefers-color-scheme: light)");
  if (prefersLightTheme.matches) {
    return "theme-light";
  }

  return "theme-dark";
};

export function setTheme(themeName, setClassName) {
  localStorage.setItem("theme", themeName);
  setClassName(themeName);
  const isLight = themeName === "theme-light";
  document.documentElement.setAttribute("data-theme", isLight ? "light" : "dark");
  document.documentElement.style.backgroundColor =
    isLight ? BACKGROUND_LIGHT : BACKGROUND_DARK;
}

export function keepTheme(setClassName) {
  setTheme(getTheme(), setClassName);
}

export const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export const lightTheme = createTheme({
  palette: {
    mode: "light",
  },
});
