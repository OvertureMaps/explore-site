import PropTypes from "prop-types";
import "./VersionSelector.css";

export const VERSION_OPTIONS = [
  "2025-03-19.1",
  "2025-02-19.0",
  "2025-01-22.0",
  "2024-12-18.0",
  "2024-11-13.0",
  "2024-10-23.0",
  "2024-09-18.0",
  "2024-08-20.0",
  "2024-07-22.0",
];

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
