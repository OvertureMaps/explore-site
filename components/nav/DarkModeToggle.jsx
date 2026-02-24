import { setTheme } from "@/lib/themeUtils";
import PropTypes from "prop-types";
import "./DarkModeToggle.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function DarkModeToggle({ mode, setMode }) {
  const toggleDarkMode = () => {
    if (mode === "theme-dark") {
      setTheme("theme-light", setMode);
    } else {
      setTheme("theme-dark", setMode);
    }
  };

  return (
    <div className="dark-mode-toggle tour-darkmode">
      <button className="clean-btn" onClick={toggleDarkMode}>
        {mode === "theme-light" ? (
          <img src={`${basePath}/lightmode.svg`} />
        ) : (
          <img src={`${basePath}/darkmode.svg`} />
        )}
      </button>
    </div>
  );
}

DarkModeToggle.propTypes = {
  mode: PropTypes.string.isRequired,
  setMode: PropTypes.func.isRequired,
};
