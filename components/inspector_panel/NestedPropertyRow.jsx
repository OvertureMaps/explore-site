import PropTypes from "prop-types";
import "./NestedPropertyRow.css";

function NestedPropertyRow({ entity, propertyName, expectedProperties = [] }) {
  if (!entity[propertyName]) {
    return null;
  }

  // Function to check if a value is a URL
  const isURL = (value) => {
    if (!value || typeof value !== 'string') return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Function to render a single URL as a clickable link
  const renderURL = (url) => (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        color: '#3b82f6',
        textDecoration: 'underline',
        wordBreak: 'break-all'
      }}
    >
      {url}
    </a>
  );

  // Function to render value content without nested-content wrapper (for recursive calls)
  const renderValueContent = (value) => {
    // Handle null/undefined
    if (value == null) return 'null';

    // Handle arrays first - render inline for simple arrays, items for complex ones
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';

      // Check if all items are URLs
      const allURLs = value.every(item => isURL(item));

      // Check if all items are simple (strings, numbers, booleans)
      const allSimple = value.every(item =>
        typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
      );

      if (allURLs) {
        // Render URL arrays as items
        return value.map((item, index) => (
          <div key={index} className="nested-item">
            {renderURL(item)}
          </div>
        ));
      } else if (allSimple && value.length <= 3) {
        // Render simple arrays inline
        return `[${value.join(', ')}]`;
      }

      // Render complex or long arrays as items
      return value.map((item, index) => (
        <div key={index} className="nested-item">
          {renderValueContent(item)}
        </div>
      ));
    }

    // Handle objects
    if (typeof value === 'object') {
      const entries = Object.entries(value).filter(([, val]) => val != null);
      if (entries.length === 0) return '{}';

      return entries.map(([objKey, val]) => (
        <div key={objKey} className="nested-item">
          <span className="nested-key">
            {objKey}:
          </span>{' '}
          {renderValueContent(val)}
        </div>
      ));
    }

    // Now handle strings - convert to string for further processing
    const stringValue = value.toString();

    // Try to parse as JSON if it looks like an array or object
    if ((stringValue.startsWith('[') && stringValue.endsWith(']')) ||
        (stringValue.startsWith('{') && stringValue.endsWith('}'))) {
      try {
        const parsed = JSON.parse(stringValue);
        return renderValueContent(parsed);
      } catch {
        // If parsing fails, fall through to regular string handling
      }
    }

    // Check if it's a URL
    if (isURL(stringValue)) {
      return renderURL(stringValue);
    }

    return stringValue;
  };

  // Function to render value with nested-content wrapper (for top-level calls)
  const renderValue = (value) => {
    // Handle simple values directly
    if (value == null ||
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean') {
      return renderValueContent(value);
    }

    // Handle arrays - check if simple first
    if (Array.isArray(value)) {
      if (value.length === 0) return '[]';

      const allSimple = value.every(item =>
        typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
      );

      if (allSimple && value.length <= 3) {
        return `[${value.join(', ')}]`;
      }
    }

    // For complex values (objects, complex arrays), wrap in nested-content
    const content = renderValueContent(value);

    // If content is a string, return it directly
    if (typeof content === 'string') {
      return content;
    }

    // Otherwise wrap in nested-content
    return (
      <div className="nested-content">
        {content}
      </div>
    );
  };

  const renderPropertyContent = () => {
    try {
      const data = typeof entity[propertyName] === 'string'
        ? JSON.parse(entity[propertyName])
        : entity[propertyName];

      if (typeof data === 'object' && !Array.isArray(data)) {
        // Handle object with expected properties first
        const renderedProperties = [];
        const processedKeys = new Set();

        // Render expected properties in order
        expectedProperties.forEach(prop => {
          if (data[prop] != null) {
            let valueToRender;

            // Special handling for 'alternate' property - render arrays without brackets
            if (prop === 'alternate' && Array.isArray(data[prop])) {
              const allSimple = data[prop].every(item =>
                typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
              );

              if (allSimple) {
                valueToRender = data[prop].join(', ');
              } else {
                valueToRender = renderValue(data[prop]);
              }
            } else {
              valueToRender = renderValue(data[prop]);
            }

            renderedProperties.push(
              <p key={prop}>
                <strong>{prop}: </strong>
                {valueToRender}
              </p>
            );
            processedKeys.add(prop);
          }
        });

        // Render any remaining properties (excluding null values)
        Object.entries(data)
          .filter(([objKey]) => !processedKeys.has(objKey))
          .filter(([, value]) => value != null)
          .forEach(([objKey, value]) => {
            renderedProperties.push(
              <p key={objKey}>
                <strong>{objKey}: </strong>
                {renderValue(value)}
              </p>
            );
          });

        return renderedProperties;
      } else if (Array.isArray(data)) {
        return data.map((item, index) => (
          <p key={index}>{renderValue(item)}</p>
        ));
      } else {
        return <p>{renderValue(data)}</p>;
      }
    } catch (e) {
      return <p>{entity[propertyName]}</p>;
    }
  };

  return (
    <div className={`panel-row ${propertyName}`}>
      <div>
        <strong>{propertyName}: </strong>
        <div className="property-content">
          {renderPropertyContent()}
        </div>
      </div>
    </div>
  );
}

NestedPropertyRow.propTypes = {
  entity: PropTypes.object.isRequired,
  propertyName: PropTypes.string.isRequired,
  expectedProperties: PropTypes.array,
};

export default NestedPropertyRow;
