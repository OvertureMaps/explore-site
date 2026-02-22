import PropTypes from "prop-types";
import Tooltip from "@mui/material/Tooltip";
import "./SourcesRow.css";

function SourcesRow({ entity, mode, tips }) {
  const sources = JSON.parse(entity["sources"]);

  const getSourceLink = (source) => {
    try {
      switch (source.dataset) {
        case "meta":
          return `https://facebook.com/${source.record_id}`;
        case "OpenStreetMap": {
          if (!source.record_id) return null;
          const match = source.record_id.match(/^([nwr])(\d+)(@\d+)?$/i);
          if (!match) return null;

          const typeMap = {
            n: "node",
            w: "way",
            r: "relation",
          };

          const type = typeMap[match[1].toLowerCase()];
          const id = match[2];

          return `https://www.openstreetmap.org/${type}/${id}`;
        }
        default:
          return null;
      }
    } catch (error) {
      console.error("Error generating source link:", error);
      return null;
    }
  };

  return (
    <div className="panel-row sources">
      <div>
        <Tooltip title={tips.source} placement="top" arrow>
          <strong style={{ cursor: "help" }}>sources: </strong>
        </Tooltip>
        <div className="sources-content">
          {sources.map((source, index) => {
            const url = getSourceLink(source);
            return (
              <div key={index}>
                <div>
                  <strong>dataset: </strong>
                  {source.dataset}
                </div>
                <div>
                  <strong>record_id: </strong>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      {source.record_id}
                    </a>
                  ) : (
                    source.record_id
                  )}
                </div>
                {source.update_time && (
                  <div>
                    <strong>update_time: </strong>
                    {source.update_time}
                  </div>
                )}
                {source.property && (
                  <div>
                    <strong>property: </strong>
                    {source.property}
                  </div>
                )}
                {source.between && (
                  <div>
                    <strong>between: </strong>
                    {source.between}
                  </div>
                )}
                {index < sources.length - 1 && (
                  <hr className="source-divider" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

SourcesRow.propTypes = {
  entity: PropTypes.object.isRequired,
  mode: PropTypes.string.isRequired,
  tips: PropTypes.object.isRequired,
};

export default SourcesRow;
