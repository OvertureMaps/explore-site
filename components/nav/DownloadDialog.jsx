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

/**
 * Static mapping from Overture source-layer type → theme metadata.
 * Ordered by the canonical theme display order.
 * This reflects the Overture data schema, not the sidebar UI categories.
 */
const THEME_ORDER = ["base", "buildings", "divisions", "transportation", "places", "addresses"];

const TYPE_TO_THEME = {
  // base
  water:          { theme: "base",           label: "Base" },
  bathymetry:     { theme: "base",           label: "Base" },
  land:           { theme: "base",           label: "Base" },
  land_use:       { theme: "base",           label: "Base" },
  land_cover:     { theme: "base",           label: "Base" },
  infrastructure: { theme: "base",           label: "Base" },
  // buildings
  building:       { theme: "buildings",      label: "Buildings" },
  building_part:  { theme: "buildings",      label: "Buildings" },
  // divisions
  division:            { theme: "divisions",      label: "Divisions" },
  division_boundary:   { theme: "divisions",      label: "Divisions" },
  division_area:       { theme: "divisions",      label: "Divisions" },
  // transportation
  segment:        { theme: "transportation", label: "Transportation" },
  connector:      { theme: "transportation", label: "Transportation" },
  // places
  place:          { theme: "places",         label: "Places" },
  // addresses
  address:        { theme: "addresses",      label: "Addresses" },
};

/** Format a source-layer type string as a human-readable name. */
function typeName(type) {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Capitalize first letter of a theme ID for use as display label. */
function themeLabel(theme) {
  return theme.charAt(0).toUpperCase() + theme.slice(1);
}

/**
 * Group an array of source-layer type strings into ordered theme buckets.
 *
 * When `stacThemeTypes` is provided (STAC-derived), it determines both the
 * mapping and the display order. Otherwise falls back to the static
 * TYPE_TO_THEME map.
 *
 * Unknown types (not found in either mapping) are placed under "Other".
 */
function groupByTheme(types, stacThemeTypes) {
  if (stacThemeTypes && stacThemeTypes.length > 0) {
    // Build reverse map: type → theme from STAC data
    const typeToTheme = {};
    for (const { theme, types: themeTypeList } of stacThemeTypes) {
      for (const t of themeTypeList) {
        typeToTheme[t] = theme;
      }
    }
    // Preserve STAC catalog order; unknown types go to "other" at end
    const stacOrder = stacThemeTypes.map((tt) => tt.theme);
    const buckets = {};
    for (const type of types) {
      const theme = typeToTheme[type] ?? "other";
      if (!buckets[theme]) buckets[theme] = [];
      buckets[theme].push(type);
    }
    return stacOrder
      .filter((t) => buckets[t])
      .map((t) => ({ theme: t, label: themeLabel(t), types: buckets[t] }))
      .concat(
        buckets.other
          ? [{ theme: "other", label: "Other", types: buckets.other }]
          : []
      );
  }

  // Static fallback
  const buckets = {};
  for (const type of types) {
    const { theme = "other", label = "Other" } = TYPE_TO_THEME[type] ?? {};
    if (!buckets[theme]) buckets[theme] = { label, types: [] };
    buckets[theme].types.push(type);
  }
  return THEME_ORDER
    .filter((t) => buckets[t])
    .map((t) => ({ theme: t, label: buckets[t].label, types: buckets[t].types }))
    .concat(
      Object.entries(buckets)
        .filter(([t]) => !THEME_ORDER.includes(t))
        .map(([t, v]) => ({ theme: t, label: v.label, types: v.types }))
    );
}

/**
 * Confirmation dialog shown before a data download begins.
 * Surfaces the dataset types grouped by theme, bounding box, and archive name
 * so users can verify — and cancel — before committing to the download.
 */
export default function DownloadDialog({ open, onConfirm, onCancel, visibleTypes, bbox, zipName, themeTypes }) {
  const hasTypes = Array.isArray(visibleTypes) && visibleTypes.length > 0;

  const bboxLabel =
    bbox && bbox.length === 4
      ? `W ${bbox[0].toFixed(4)}, S ${bbox[1].toFixed(4)}, E ${bbox[2].toFixed(4)}, N ${bbox[3].toFixed(4)}`
      : null;

  const themeGroups = groupByTheme(visibleTypes, themeTypes);

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

        {hasTypes ? (
          <Box sx={{ mt: 1.5 }} data-testid="download-dialog-types">
            {themeGroups.map(({ theme, label, types }) => (
              <Box key={theme} sx={{ mb: 1 }} data-testid={`theme-${theme}`}>
                <Typography
                  variant="caption"
                  fontWeight={700}
                  color="text.secondary"
                  sx={{ textTransform: "uppercase", letterSpacing: 0.5, display: "block", pb: 0.25 }}
                >
                  {label}
                </Typography>
                <List dense disablePadding>
                  {types.map((type) => (
                    <ListItem key={type} disableGutters sx={{ py: 0, pl: 1 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <Checkbox
                          checked
                          disabled
                          size="small"
                          disableRipple
                          inputProps={{ "aria-label": typeName(type) }}
                          sx={{ p: 0.5 }}
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={typeName(type)}
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
  themeTypes: PropTypes.arrayOf(
    PropTypes.shape({
      theme: PropTypes.string.isRequired,
      types: PropTypes.arrayOf(PropTypes.string).isRequired,
    })
  ),
};
