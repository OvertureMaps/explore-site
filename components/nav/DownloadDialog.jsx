import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";

/**
 * Confirmation dialog shown before a data download begins.
 * Surfaces the layers, file format, and bounding box so users can
 * verify — and cancel — before committing to the download.
 */
export default function DownloadDialog({ open, onConfirm, onCancel, visibleTypes, bbox }) {
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
          The following visible layers will be downloaded as GeoJSON files
          bundled into a single ZIP archive.
        </Typography>

        {hasTypes ? (
          <List dense disablePadding sx={{ mt: 1 }}>
            {visibleTypes.map((type) => (
              <ListItem key={type} disableGutters sx={{ py: 0 }}>
                <ListItemText
                  primary={type}
                  primaryTypographyProps={{ variant: "body2" }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            No visible layers available for download.
          </Typography>
        )}

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
        <Typography variant="caption" color="text.secondary">
          Format: GeoJSON (ZIP) · Coordinate system: WGS 84
        </Typography>
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
};
