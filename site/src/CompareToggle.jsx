import CompareIcon from "@mui/icons-material/Compare";
import PropTypes from "prop-types";
import "./CompareToggle.css";

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
