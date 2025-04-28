import PropTypes from "prop-types";
import "./VersionSelector.css";
import { VERSION_OPTIONS } from "./VersionConstants";

export default function VersionSelector({ version, onChange, style }) {
  return (
    <select
      className="version-selector"
      value={version}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    >
      {VERSION_OPTIONS.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}

VersionSelector.propTypes = {
  version: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  style: PropTypes.object,
};
