import PropTypes from "prop-types";
import { useState } from "react";
import "./TableRow.css";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";

function TableRow({ mode, table_key, entity }) {
  const [expanded, setExpanded] = useState(false);

  const handleExpand = () => {
    setExpanded(!expanded);
  };

  return (
    <tr key={table_key}>
      <td className={expanded ? "expanded" : "collapsed"}>
        <div className="first-child">
          <strong>{table_key}</strong>
          <button className="expand" onClick={handleExpand}>
            {entity[table_key] != "null" ? (
              <div>
                {expanded ? (
                  <RemoveIcon className="ec-icon" fontSize="small" />
                ) : (
                  <AddIcon className="ec-icon" fontSize="small" />
                )}{" "}
              </div>
            ) : (
              ""
            )}
          </button>
        </div>
      </td>
      {entity[table_key] != null ? (
        <td className={expanded ? "expanded" : "collapsed"}>
          {entity[table_key].toString()}{" "}
        </td>
      ) : (
        <td className={expanded ? "expanded" : "collapsed"}>None Found</td>
      )}
    </tr>
  );
}

TableRow.propTypes = {
  entity: PropTypes.object,
};
export default TableRow;
