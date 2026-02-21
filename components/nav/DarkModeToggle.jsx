import { setTheme } from "@/lib/themeUtils";
import PropTypes from "prop-types";
import "./DarkModeToggle.css";

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
          <img src="/lightmode.svg" />
        ) : (
          <img src="/darkmode.svg" />
        )}
      </button>
    </div>
  );
}

DarkModeToggle.propTypes = {
  mode: PropTypes.string.isRequired,
  setMode: PropTypes.func.isRequired,
};
