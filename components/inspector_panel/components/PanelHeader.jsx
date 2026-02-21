import PropTypes from "prop-types";
import CloseIcon from "@mui/icons-material/Close";

function PanelHeader({ title, onClose }) {
  return (
    <div className="panel-header">
      <h6 className="title">{title}</h6>
      <button
        className="close-panel-button"
        onClick={onClose}
      >
        <CloseIcon className="close-panel-icon" />
      </button>
    </div>
  );
}

PanelHeader.propTypes = {
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PanelHeader;
