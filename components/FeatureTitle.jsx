import PropTypes from "prop-types";

export default function FeatureTitle({ entity }) {
  if (entity.theme === "addresses") {
    const addressParts = [entity.number, entity.unit, entity.street].filter(
      Boolean
    );

    return addressParts.join(" ");
  }

  return (
    entity["@name"] ||
    (entity["names"] && JSON.parse(entity["names"]).primary) ||
    `${entity["type"]}${
      entity["subtype"] && entity["subtype"] !== entity["type"]
        ? ` (${entity["subtype"]})`
        : ""
    }`
  );
}

FeatureTitle.propTypes = {
  entity: PropTypes.shape({
    theme: PropTypes.string,
    "@name": PropTypes.string,
    names: PropTypes.string,
    type: PropTypes.string,
    subtype: PropTypes.string,
    country: PropTypes.string,
    postcode: PropTypes.string,
    street: PropTypes.string,
    number: PropTypes.string,
    unit: PropTypes.string,
    postal_city: PropTypes.string,
  }).isRequired,
};
