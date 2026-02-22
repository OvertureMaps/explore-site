import PropTypes from "prop-types";
import TableRow from "@/components/inspector_panel/TableRow";
import Tooltip from "@mui/material/Tooltip";
import "./ThemePanel.css";
import IndentIcon from "@/components/icons/icon-indent.svg?react";
import SourcesRow from "@/components/inspector_panel/SourcesRow";
import NestedPropertyRow from "@/components/inspector_panel/NestedPropertyRow";

const sharedProperties = [
  "theme",
  "type",
  "update_time",
  "id",
  "sources",
  "names",
  "categories",
  "subtype",
  "class",
  "subclass",
  "version",
];

function ThemePanel({ mode, entity, tips }) {
  return (
    <div className="theme-panel">
      {entity["id"] ? (
        <div className="panel-row id">
          <div>
            <Tooltip title="A feature ID, typically associated with the Global Entity Reference System (GERS). Double click to copy." placement="top" arrow>
              <strong style={{ cursor: "help" }}>GERS: </strong>
            </Tooltip>
            <span style={{ fontSize: "11px" }} onDoubleClick={() => {
                navigator.clipboard.writeText(entity["id"]);
              }}>{entity["id"]}</span>
          </div>
        </div>
      ) : (
        <></>
      )}
      <div className="panel-row theme">
        <div>
          <Tooltip title={tips.theme} placement="top" arrow>
            <strong style={{ cursor: "help" }}>theme: </strong>
          </Tooltip>
          {entity["theme"]}
        </div>
      </div>
      <div className="panel-row type">
        <div>
          <Tooltip title={tips.type} placement="top" arrow>
            <strong style={{ cursor: "help" }}>type: </strong>
          </Tooltip>
          {entity["type"]}
        </div>
      </div>
      {entity["subtype"] ? (
        <div className="panel-row subtype">
          <div>
            <IndentIcon />{" "}
            <Tooltip title={tips.subtype} placement="top" arrow>
              <strong style={{ cursor: "help" }}>subtype: </strong>
            </Tooltip>
            {entity["subtype"]}
          </div>
        </div>
      ) : (
        <></>
      )}
      {entity["class"] ? (
        <div className="panel-row class">
          <div>
            <Tooltip title={tips.class || "Classification of the feature"} placement="top" arrow>
              <strong style={{ cursor: "help" }}>class: </strong>
            </Tooltip>
            {entity["class"]}
            {entity["subclass"] ? (
              <div style={{ paddingLeft: "15px" }}>
                <IndentIcon /> <strong>subclass: </strong>
                {entity["subclass"]}
              </div>
            ) : (
              <></>
            )}
          </div>
        </div>
      ) : (
        <></>
      )}
      <NestedPropertyRow
        entity={entity}
        propertyName="names"
        expectedProperties={["primary", "common", "rules"]}
      />
      <NestedPropertyRow
        entity={entity}
        propertyName="categories"
        expectedProperties={["primary", "alternate"]}
      />

      {entity["sources"] ? (
        <SourcesRow entity={entity} mode={mode} tips={tips} />
      ) : (
        <></>
      )}
      {["version"].map((key) => (
        <div key={key} className="panel-row id">
          <div>
            <strong>{key}: </strong>
            {entity[key]}
          </div>
        </div>
      ))}
      <table className="theme-panel-table">
        <tbody>
          {Object.keys(entity)
            .filter((key) => !key.startsWith("@"))
            .filter((key) => !sharedProperties.includes(key))
            .filter((key) => entity[key] != null && entity[key] !== "null")
            .map((key) => (
              <TableRow key={key} table_key={key} entity={entity} />
            ))}
        </tbody>
      </table>
    </div>
  );
}

ThemePanel.propTypes = {
  mode: PropTypes.string.isRequired,
  entity: PropTypes.object.isRequired,
  tips: PropTypes.object.isRequired,
};

export default ThemePanel;
