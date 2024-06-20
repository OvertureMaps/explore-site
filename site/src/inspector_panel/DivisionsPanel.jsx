import TableRow from "./TableRow";
import "./DivisionsPanel.css";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState } from "react";
import IndentIcon from "../icons/icon-indent.svg?react";
import InfoToolTip from "./InfoToolTip";

const sharedProperties = [
  "theme",
  "type",
  "update_time",
  "id",
  "sources",
  "subtype",
  "version",
];
function DivisionsPanel({ mode, entity }) {
  const [commonExpanded, setCommonExpanded] = useState(false);
  const [otherExpanded, setOtherExpanded] = useState(false);

  const hasSources = entity["sources"] != null;

  return (
    <div className="div-panel">
      <div className="panel-row theme">
        <div>
          <strong>Theme: </strong>
          {entity["theme"]}
        </div>
        <InfoToolTip
          mode={mode}
          content={"placeholder"}
          target={"div-theme-tip"}
        />
      </div>
      <div className="panel-row type">
        <div>
          <strong>Type: </strong>
          {entity["type"]}
        </div>
        <InfoToolTip
          mode={mode}
          content={"placeholder"}
          target={"div-type-tip"}
        />
      </div>
      <div className="panel-row subtype">
        <div>
          <IndentIcon /> <strong>Subtype: </strong>
          {entity["subtype"]}{" "}
        </div>{" "}
        <InfoToolTip
          mode={mode}
          content={"placeholder"}
          target={"div-subtype-tip"}
        />
      </div>{" "}
      <div className="panel-row id">
        <div>
          <strong>ID: </strong>
          {entity["id"] != null ? entity["id"] : "None Found"}
        </div>
        <InfoToolTip
          mode={mode}
          content={"placeholder"}
          target={"div-id-tip"}
        />
      </div>
      {hasSources ? (
        <div className="panel-row sources">
          <div>
            <strong>Source(s): </strong>{" "}
            {JSON.parse(entity["sources"]).map(
              (source) => `${source["dataset"]}, `
            )}
          </div>
          <InfoToolTip
            mode={mode}
            content={"placeholder"}
            target={"div-sources-tip"}
          />
        </div>
      ) : (
        <div className="panel-row sources">
          {" "}
          <div>
            <strong>Source(s): </strong>None Found
          </div>
          <InfoToolTip
            mode={mode}
            content={"placeholder"}
            target={"div-source-tip"}
          />
        </div>
      )}
      <div className="common-properties">
        <table className="divisions-table">
          <caption className="common-props">
            <button
              className="divisions-table"
              onClick={() => setCommonExpanded(!commonExpanded)}
            >
              Common Properties{" "}
              {commonExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </button>
          </caption>
          {commonExpanded ? (
            <tbody>
              {["update_time", "version"].map((key) => (
                <TableRow table_key={key} entity={entity} />
              ))}
            </tbody>
          ) : (
            <tbody></tbody>
          )}
        </table>
      </div>
      <div className="other-properties">
        <table className="divisions-table">
          <caption className="other-props">
            <button
              className="divisions-table"
              onClick={() => setOtherExpanded(!otherExpanded)}
            >
              Other Properties{" "}
              {otherExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </button>
          </caption>
          {otherExpanded ? (
            <tbody>
              {Object.keys(entity)
                .filter((key) => !key.startsWith("@"))
                .filter((key) => !sharedProperties.includes(key))
                .map((key) => (
                  <TableRow table_key={key} entity={entity} />
                ))}
            </tbody>
          ) : (
            <tbody></tbody>
          )}
        </table>
      </div>
    </div>
  );
}

export default DivisionsPanel;
