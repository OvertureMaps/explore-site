import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

/** Format a source-layer type string as a human-readable name. */
function typeName(type) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/**
 * Confirmation dialog shown before a data download begins.
 * Surfaces the dataset types, bounding box, and archive name so users
 * can verify — and cancel — before committing to the download.
 */
export default function DownloadDialog({ open, onConfirm, onCancel, visibleTypes, bbox, zipName }) {
  const hasTypes = Array.isArray(visibleTypes) && visibleTypes.length > 0;

  const bboxLabel =
    bbox && bbox.length === 4
      ? `W ${bbox[0].toFixed(4)}, S ${bbox[1].toFixed(4)}, E ${bbox[2].toFixed(4)}, N ${bbox[3].toFixed(4)}`
      : null;

  return (
    <Dialog
      open={open}
      onClose={onCancel}
      aria-labelledby="download-dialog-title"
      maxWidth="xs"
      fullWidth
    >
      <DialogTitle id="download-dialog-title">Confirm Download</DialogTitle>

      <DialogContent dividers>
        <Typography variant="body2" gutterBottom>
          The following dataset types will be downloaded as GeoJSON files
          bundled into a single ZIP archive (under ~10 MB).
          To remove a type, disable it using the layer toggler before
          downloading.
        </Typography>

        {bboxLabel && (
          <>
            <Divider sx={{ my: 1.5 }} />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">
                Bounding box
              </Typography>
              <Typography variant="body2" data-testid="download-dialog-bbox">
                {bboxLabel}
              </Typography>
            </Box>
          </>
        )}

        <Divider sx={{ my: 1.5 }} />
        <Box>
          <Typography variant="caption" color="text.secondary" display="block">
            Archive name
          </Typography>
          {zipName ? (
            <Typography
              variant="body2"
              data-testid="download-dialog-zipname"
              sx={{ wordBreak: "break-all", fontFamily: "monospace" }}
            >
              {zipName}
            </Typography>
          ) : (
            <CircularProgress size={12} sx={{ mt: 0.5 }} aria-label="Loading archive name" />
          )}
        </Box>

        <Divider sx={{ my: 1.5 }} />
        {hasTypes ? (
          <Box component="ul" data-testid="download-dialog-types" sx={{ mt: 1, mb: 0, pl: 3 }}>
            {visibleTypes.map((type) => (
              <Typography component="li" variant="body2" key={type}>
                {typeName(type)}
              </Typography>
            ))}
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No visible layers available for download.
          </Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onCancel} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          disabled={!hasTypes}
          startIcon={
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              download_for_offline
            </span>
          }
        >
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
}

DownloadDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  visibleTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  bbox: PropTypes.arrayOf(PropTypes.number),
  zipName: PropTypes.string,
};
