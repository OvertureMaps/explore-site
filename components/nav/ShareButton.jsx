import { useState } from "react";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import { ShareAndroid } from "iconoir-react";
import PropTypes from "prop-types";

export default function ShareButton({ visibleTypes, inspectMode, activeFeature }) {
  const [snackOpen, setSnackOpen] = useState(false);

  const handleShare = () => {
    const url = new URL(window.location.href);
    url.searchParams.set("layers", visibleTypes.join(","));
    url.searchParams.set("mode", inspectMode ? "inspect" : "explore");

    if (activeFeature?.properties?.id) {
      const featureKey = [
        activeFeature.source,
        activeFeature.sourceLayer,
        activeFeature.properties.id,
      ].join(".");
      url.searchParams.set("feature", featureKey);
    } else {
      url.searchParams.delete("feature");
    }

    navigator.clipboard.writeText(url.toString()).then(() => {
      setSnackOpen(true);
    });
  };

  return (
    <>
      <Tooltip title="Copy link to current view">
        <IconButton
          onClick={handleShare}
          aria-label="Copy link to current view"
          sx={{ color: "inherit" }}
        >
          <ShareAndroid width={20} height={20} />
        </IconButton>
      </Tooltip>
      <Snackbar
        open={snackOpen}
        autoHideDuration={2000}
        onClose={() => setSnackOpen(false)}
        message="Link copied to clipboard"
      />
    </>
  );
}

ShareButton.propTypes = {
  visibleTypes: PropTypes.array.isRequired,
  inspectMode: PropTypes.bool.isRequired,
  activeFeature: PropTypes.object,
};
