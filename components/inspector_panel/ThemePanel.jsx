import PropTypes from "prop-types";
import TableRow from "@/components/inspector_panel/TableRow";
import "./ThemePanel.css";
import IndentIcon from "@/components/icons/icon-indent.svg?react";
import InfoToolTip from "@/components/inspector_panel/InfoToolTip";
import PushPinIcon from "@mui/icons-material/PushPin";
import PushPinOutlinedIcon from "@mui/icons-material/PushPinOutlined";
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

function ThemePanel({ mode, entity, tips, activeThemes, setActiveThemes }) {
  return (
    <div className="theme-panel">
      {entity["id"] ? (
        <div className="panel-row id">
          <div>
            <strong>id: </strong>
            <span onDoubleClick={() => {
                navigator.clipboard.writeText(entity["id"]);
              }}>{entity["id"]}</span>
          </div>
          <InfoToolTip mode={mode} content=
            "A feature ID, typically associated with the Global Entity Reference System (GERS). Double Click to copy to clipboard"
          target={"theme-id-tip"} />
        </div>
      ) : (
        <></>
      )}
      <div className="panel-row theme">
        <div>
          <strong>theme: </strong>
          {entity["theme"]}
        </div>
        <div className="actions">
          <div
            className="pin"
            onClick={() => {
              if (activeThemes.includes(entity["theme"])) {
                setActiveThemes(
                  activeThemes.filter((t) => t !== entity["theme"])
                );
              } else {
                setActiveThemes(activeThemes.concat(entity["theme"]));
              }
            }}
          >
            {activeThemes.includes(entity["theme"]) ? (
              <PushPinIcon />
            ) : (
              <PushPinOutlinedIcon />
            )}
          </div>
          <InfoToolTip
            mode={mode}
            content={tips.theme}
            target={"theme-theme-tip"}
          />
        </div>
      </div>
      <div className="panel-row type">
        <div>
          <strong>type: </strong>
          {entity["type"]}
        </div>
        <InfoToolTip
          mode={mode}
          content={tips.type}
          target={"theme-type-tip"}
        />
      </div>
      {entity["subtype"] ? (
        <div className="panel-row subtype">
          <div>
            <IndentIcon /> <strong>subtype: </strong>
            {entity["subtype"]}
          </div>
          <InfoToolTip
            mode={mode}
            content={tips.subtype}
            target={"theme-subtype-tip"}
          />
        </div>
      ) : (
        <></>
      )}
      {entity["class"] ? (
        <div className="panel-row class">
          <div>
            <strong>class: </strong>
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
          <InfoToolTip
            mode={mode}
            content={tips.class || "Classification of the feature"}
            target={"theme-class-tip"}
          />
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
  activeThemes: PropTypes.array.isRequired,
  setActiveThemes: PropTypes.func.isRequired,
};

export default ThemePanel;
