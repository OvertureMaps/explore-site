import { createTheme } from "@mui/material";

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
  document.documentElement.setAttribute(
    "data-theme",
    themeName === "theme-light" ? "light" : "dark"
  );
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
