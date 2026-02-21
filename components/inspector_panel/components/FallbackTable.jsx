import PropTypes from "prop-types";
import TableRow from "@/components/inspector_panel/TableRow";
import { createOrderedKeys } from "@/components/inspector_panel/utils/PropertyOrderer";

function FallbackTable({ mode, entity }) {
  const orderedKeys = createOrderedKeys(entity);

  return (
    <table>
      <tbody>
        {orderedKeys.map(({ key, indented }) => (
          <TableRow
            key={key}
            mode={mode}
            table_key={key}
            entity={entity}
            indented={indented}
          />
        ))}
      </tbody>
    </table>
  );
}

FallbackTable.propTypes = {
  mode: PropTypes.string,
  entity: PropTypes.object.isRequired,
};

export default FallbackTable;
