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
import ListItemIcon from "@mui/material/ListItemIcon";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import Box from "@mui/material/Box";
import { exploreHierarchy } from "@/lib/layerHierarchy";


/**
 * Confirmation dialog shown before a data download begins.
 * Surfaces the layers, file format, and bounding box so users can
 * verify — and cancel — before committing to the download.
 */
export default function DownloadDialog({ open, onConfirm, onCancel, visibleTypes, bbox, zipName }) {
  const hasTypes = Array.isArray(visibleTypes) && visibleTypes.length > 0;

  const bboxLabel =
    bbox && bbox.length === 4
      ? `W ${bbox[0].toFixed(4)}, S ${bbox[1].toFixed(4)}, E ${bbox[2].toFixed(4)}, N ${bbox[3].toFixed(4)}`
      : null;

  // Filter hierarchy to only themes whose source-layer type is visible.
  const visibleHierarchy = exploreHierarchy
    .map((theme) => ({
      ...theme,
      items: theme.items.filter((item) => visibleTypes.includes(item.type)),
    }))
    .filter((theme) => theme.items.length > 0);

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
          bundled into a single ZIP archive. For best results, zoom in until
          your area of interest is small — downloads work best under ~10 MB.
          To remove a layer, disable it using the layer toggler before
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

        {hasTypes ? (
          <Box sx={{ mt: 1.5 }}>
            {visibleHierarchy.map((theme) => (
              <Box key={theme.key} sx={{ mb: 1 }}>
                {/* Theme header row */}
                <Box
                  sx={{ py: 0.25 }}
                  data-testid={`theme-${theme.key}`}
                >
                  <Typography
                    variant="caption"
                    fontWeight={700}
                    color="text.secondary"
                    sx={{ textTransform: "uppercase", letterSpacing: 0.5 }}
                  >
                    {theme.name}
                  </Typography>
                </Box>

                <List dense disablePadding>
                  {theme.items.map((item) => (
                    <ListItem
                      key={item.type}
                      disableGutters
                      sx={{ py: 0, pl: 1 }}
                    >
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Checkbox
                          checked
                          disabled
                          size="small"
                          disableRipple
                          inputProps={{ "aria-label": item.name }}
                          sx={{ p: 0.5 }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.name}
                        primaryTypographyProps={{ variant: "body2" }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
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
