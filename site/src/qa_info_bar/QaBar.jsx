import PropTypes from "prop-types";
import "./QaBar.css";

// This component sits below the header navbar, but above the map. It contains pertinent information for the QA Table
export default function QaBar() {
    return (
      <nav aria-label="Qa Info" className="qa-bar qabar--fixed-top">
        <div className="qa-bar__inner nodrop">
        DRAG AND DROP FILES HERE
        </div>
      </nav>
    );
  }
  
  QaBar.propTypes = {
    mode: PropTypes.string.isRequired,
    setMode: PropTypes.func.isRequired,
  };
  