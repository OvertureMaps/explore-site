import LocationOnIcon from "@mui/icons-material/LocationOn";
import HomeIcon from "@mui/icons-material/Home";
import TerrainIcon from "@mui/icons-material/Terrain";
import DirectionsIcon from "@mui/icons-material/Directions";
import FlagIcon from "@mui/icons-material/Flag";
import ImportContactsIcon from "@mui/icons-material/ImportContacts";
import PropTypes from "prop-types";

function ThemeIcon({ theme }) {
  switch (theme) {
    case "places":
      return <LocationOnIcon />;
    case "buildings":
      return <HomeIcon />;
    case "base":
      return <TerrainIcon />;
    case "transportation":
      return <DirectionsIcon />;
    case "divisions":
      return <FlagIcon />;
    case "addresses":
      return <ImportContactsIcon />;
    default:
      return <></>;
  }
}

ThemeIcon.propTypes = {
  theme: PropTypes.string.isRequired,
};

export default ThemeIcon;
