import PropTypes from "prop-types";
import "./QaVersionSelector.css";
import { TWO_WEEKS_DS } from "./VersionConstants";

export default function QaVersionSelector({ version, onChange, style }) {
  return (
    <select
      className="qa-version-selector"
      value={version}
      onChange={(e) => onChange(e.target.value)}
      style={style}
    >
      {TWO_WEEKS_DS.map((v) => (
        <option key={v} value={v}>
          {v}
        </option>
      ))}
    </select>
  );
}

QaVersionSelector.propTypes = {
  version: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  style: PropTypes.object,
};
