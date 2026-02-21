const BASE_THEME =
  "Provides the land and water features that are necessary to render a complete basemap.";
const BASE_TYPE =
  "Describes the feature type of the entity. The base theme is split into five feature types: infrastructure, land, land_cover, land_use, and water.";
const BASE_SUBTYPE = "Further description of the feature type.";
const BASE_ID =
  "A feature ID. This may be an ID associated with the Global Entity Reference System (GERS) if—and-only-if the feature represents an entity that is part of GERS.";
const BASE_SOURCE =
  "The array of source information for the properties of a given entity";
export const BASE_TIPS = {
  theme: BASE_THEME,
  type: BASE_TYPE,
  subtype: BASE_SUBTYPE,
  id: BASE_ID,
  source: BASE_SOURCE,
};

const BUILDING_THEME =
  "Describes human-made structures with roofs or interior spaces that are permanently or semi-permanently in one place.";
const BUILDING_TYPE =
  "Describes the feature type of the entity. The building theme is split into two feature types: building, and building_part.";
const BUILDING_SUBTYPE = "A broad category of the building type and purpose.";
const BUILDING_ID =
  "A feature ID that may be associated with the Global Entity Reference System (GERS) if—and-only-if the feature represents an entity that is part of GERS.";
const BUILDING_SOURCE =
    "The array of source information for the properties of a given entity";
export const BUILDING_TIPS = {
  theme: BUILDING_THEME,
  type: BUILDING_TYPE,
  subtype: BUILDING_SUBTYPE,
  id: BUILDING_ID,
  source: BUILDING_SOURCE,
};

const DIVISION_THEME =
  "Includes features that represent human settlements in the real world, such as countries, regions, states, cities and towns.";
const DIVISION_TYPE =
  "Describes the feature type of the entity. The divisions theme is split into 3 types: division, division_area, and boundary.";
const DIVISION_SUBTYPE = "Further description of the feature type.";
const DIVISION_ID =
  "A feature ID. This may be an ID associated with the Global Entity Reference System (GERS) if—and-only-if the feature represents an entity that is part of GERS.";
const DIVISION_SOURCE =
  "The array of source information for the properties of a given feature, with each entry being a source object which lists the property in JSON Pointer notation and the dataset that specific value came from. All features must have a root level source which is the default source if a specific property's source is not specified.";
export const DIVISION_TIPS = {
  theme: DIVISION_THEME,
  type: DIVISION_TYPE,
  subtype: DIVISION_SUBTYPE,
  id: DIVISION_ID,
  source: DIVISION_SOURCE,
};

const TRANSPORTATION_THEME =
  "The collection of features and attributes that describe the infrastructure and conventions of how people and objects travel around the world. ";
const TRANSPORTATION_TYPE =
  "Further describes the entity. The transportation theme contains the segment feature type and the connector feature type.";
const TRANSPORTATION_SUBTYPE = "Further describes the feature type.";
const TRANSPORTATION_ID =
  "A feature ID. This may be an ID associated with the Global Entity Reference System (GERS) if—and-only-if the feature represents an entity that is part of GERS.";
const TRANSPORTATION_SOURCE =
  "The array of source information for the properties of a given feature, with each entry being a source object which lists the property in JSON Pointer notation and the dataset that specific value came from. All features must have a root level source which is the default source if a specific property's source is not specified.";
const TRANSPORTATION_CLASS =
  "Further describes the transportation entity by its 'class'";
export const TRANSPORTATION_TIPS = {
  theme: TRANSPORTATION_THEME,
  type: TRANSPORTATION_TYPE,
  subtype: TRANSPORTATION_SUBTYPE,
  id: TRANSPORTATION_ID,
  source: TRANSPORTATION_SOURCE,
  class: TRANSPORTATION_CLASS,
};

const PLACES_THEME =
  "Contains datasets with point representations of real-world facilities, services, businesses or amenities.";
const PLACES_TYPE =
  "Describes the entity. The places theme only has one type: place.";
const PLACES_SUBTYPE = "Further describes the feature type.";
const PLACES_ID =
  "A feature ID. This may be an ID associated with the Global Entity Reference System (GERS) if—and-only-if the feature represents an entity that is part of GERS.";
const PLACES_SOURCE =
  "The array of source information for the properties of a given feature, with each entry being a source object which lists the property in JSON Pointer notation and the dataset that specific value came from. All features must have a root level source which is the default source if a specific property's source is not specified.";
export const PLACES_TIPS = {
  theme: PLACES_THEME,
  type: PLACES_TYPE,
  subtype: PLACES_SUBTYPE,
  id: PLACES_ID,
  source: PLACES_SOURCE,
};

const ADDRESSES_THEME =
  "The Overture Address type is a compilation of open address datasets usually published by local authorized sources";
const ADDRESSES_TYPE =
  "Describes the entity. The addresses theme only has one type: address.";
const ADDRESSES_SUBTYPE = "";
const ADDRESSES_ID =
  "A feature ID. This may be an ID associated with the Global Entity Reference System (GERS) if—and-only-if the feature represents an entity that is part of GERS.";
const ADDRESSES_SOURCE =
  "The array of source information for the properties of a given feature, with each entry being a source object which lists the property in JSON Pointer notation and the dataset that specific value came from. All features must have a root level source which is the default source if a specific property's source is not specified.";
export const ADDRESSES_TIPS = {
  theme: ADDRESSES_THEME,
  type: ADDRESSES_TYPE,
  subtype: ADDRESSES_SUBTYPE,
  id: ADDRESSES_ID,
  source: ADDRESSES_SOURCE,
};
