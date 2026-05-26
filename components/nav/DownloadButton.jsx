import PropTypes from "prop-types";
import { useMapInstance } from "@/lib/MapContext";
import { useEffect, useRef, useState } from "react";
import { getDownloadCatalog } from "@/lib/DownloadCatalog";
import { getLatestReleaseVersion } from "@/lib/stacService";
import {
  ParquetDataset,
  set_panic_hook,
  writeGeoJSON,
} from "@geoarrow/geoarrow-wasm/esm/index.js";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import initWasm from "@geoarrow/geoarrow-wasm/esm/index.js";
import { getVisibleTypes } from "@/lib/LayerManager";
import { downloadAsZip } from "@/lib/zipDownload";
import { buildDownloadMetadata } from "@/lib/downloadMetadata";
import DownloadDialog from "@/components/nav/DownloadDialog";

const ZOOM_BOUND = 15;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function DownloadButton({ mode, zoom, setZoom, visibleTypes}) {
  const map = useMapInstance();

  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingBbox, setPendingBbox] = useState(null);
  const [zipName, setZipName] = useState(null);
  const loadReqRef = useRef(0);

  useEffect(() => {
    if (map) {
      map.getBounds();
      setZoom(map.getZoom());
    }
  }, [map, setZoom]);

  // Fetches the release version in the background while the dialog is open
  // in order to pre-compute the archive name. A request token guards against
  // stale responses overwriting state when the dialog is cancelled and
  // reopened before the previous fetch completes.
  const loadDialogInfo = async (bbox) => {
    const reqId = ++loadReqRef.current;
    try {
      const releaseVersion = await getLatestReleaseVersion();
      if (reqId !== loadReqRef.current) return; // stale — a newer open superseded this one
      const bboxStr = bbox.map((v) => v.toFixed(3)).join(",");
      setZipName(`overture-${releaseVersion}-${bboxStr}.zip`);
    } catch (err) {
      console.error("Failed to load dialog info:", err);
      // Leave zipName null — dialog degrades gracefully.
    }
  };

  // Opens the confirmation dialog and captures the current bbox.
  const handleDownloadClick = () => {
    if (!map) return;
    const bounds = map.getBounds();
    const bbox = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth(),
    ];
    setPendingBbox(bbox);
    setZipName(null);
    setDialogOpen(true);
    loadDialogInfo(bbox);
  };

  const handleDialogCancel = () => {
    setDialogOpen(false);
    setPendingBbox(null);
  };

  // Runs after user confirms in dialog.
  const handleDialogConfirm = async () => {
    setDialogOpen(false);

    if (!map || !pendingBbox) return;

    const bbox = pendingBbox;
    setPendingBbox(null);

    //TODO: Make this async and parallelize with the startup of the map component, rather than blocking in.
    await initWasm();


    setLoading(true);
    try {
      //Send those to the download engine
      const xmin = ["bbox", "xmin"];
      const ymin = ["bbox", "ymin"];
      const xmax = ["bbox", "xmax"];
      const ymax = ["bbox", "ymax"];

      const readOptions = {
        bbox: bbox,
        bboxPaths: {
          xmin,
          ymin,
          xmax,
          ymax,
        },
      };

      set_panic_hook();

      // Get the download catalog and release version concurrently (STAC data is shared/cached)
      const [downloadCatalog, releaseVersion] = await Promise.all([
        getDownloadCatalog(bbox, getVisibleTypes(visibleTypes)),
        getLatestReleaseVersion(),
      ]);

      console.log(downloadCatalog);

      if (!downloadCatalog.types || downloadCatalog.types.length === 0) {
        console.warn("No data available to download in the current view");
        setLoading(false);
        return;
      }

      // The catalog contains a base path and then a list of types with filenames.
      //First, assemble the parquet datasets in parallel.
      let datasets = downloadCatalog.types.map((type) => {
        return new ParquetDataset(downloadCatalog.basePath, type.files).then(
          (dataset) => {
            return { type: type.name, parquet: dataset };
          }
        );
      });

      try {
        const resolvedDatasets = await Promise.all(datasets);
        const wasmTables = await Promise.all(
          resolvedDatasets.map((dataset) =>
            dataset.parquet.read(readOptions).then((reader) => ({
              type: dataset.type,
              reader,
            }))
          )
        );

        const bboxStr = bbox.map((v) => v.toFixed(3)).join(",");

        // Collect each non-empty layer as a GeoJSON file inside a single ZIP.
        // Bundling avoids iOS Safari silently dropping multi-file downloads
        // and Chrome's "allow multiple downloads" prompt — see issue #190.
        const nonEmptyTables = wasmTables.filter(
          (wasmTable) => wasmTable?.reader?.numBatches > 0
        );

        const files = nonEmptyTables.map((wasmTable) => ({
          name: `overture-${releaseVersion}-${wasmTable.type}-${bboxStr}.geojson`,
          data: writeGeoJSON(wasmTable.reader),
        }));

        if (files.length === 0) {
          console.warn("No non-empty layers in the current view");
          return;
        }

        // Include a metadata.json describing the bbox, release, and current
        // map view URL so the download is self-describing and reproducible
        // via overturemaps-py / DuckDB. See issue #156.
        files.push({
          name: "metadata.json",
          data: buildDownloadMetadata({
            bbox,
            releaseVersion,
            layers: nonEmptyTables.map((t) => t.type),
            viewUrl: typeof window !== "undefined" ? window.location.href : undefined,
          }),
        });

        const archiveName = `overture-${releaseVersion}-${bboxStr}.zip`;
        downloadAsZip(files, archiveName);
      } catch (error) {
        // Something went wrong with the download.
        console.error("An error occurred during the download:", error);
        alert("An error occurred during the download. Please try again.");
      }
    } catch (error) {
      console.error("Error in download process:", error);
      alert("An error occurred while preparing the download. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading || zoom < ZOOM_BOUND;

  const downloadIcon = (
    <Tooltip
      title={
        zoom < ZOOM_BOUND ? (
          <span>
            Download is disabled below zoom {ZOOM_BOUND}. Zoom in to enable. For larger areas, use{" "}
            <a
              href="https://github.com/OvertureMaps/overturemaps-py"
              target="_blank"
              rel="noreferrer noopener"
              style={{ color: "#90caf9" }}
            >
              overturemaps-py
            </a>
            .
          </span>
        ) : loading ? "Downloading..." : "Download visible layers"
      }
      arrow
    >
      <span>
        <IconButton
          onClick={handleDownloadClick}
          disabled={isDisabled}
          aria-label="Download visible layers"
          sx={{
            color: "inherit",
            animation: loading ? "spin 1s linear infinite" : "none",
            "@keyframes spin": {
              from: { transform: "rotate(0deg)" },
              to: { transform: "rotate(-360deg)" },
            },
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>download_for_offline</span>
        </IconButton>
      </span>
    </Tooltip>
  );

  return (
    <>
      {downloadIcon}
      <DownloadDialog
        open={dialogOpen}
        onConfirm={handleDialogConfirm}
        onCancel={handleDialogCancel}
        visibleTypes={getVisibleTypes(visibleTypes)}
        bbox={pendingBbox}
        zipName={zipName}
        themeTypes={themeTypes}
      />
    </>
  );
}

DownloadButton.propTypes = {
  mode: PropTypes.string.isRequired,
  zoom: PropTypes.number.isRequired,
  setZoom: PropTypes.func.isRequired,
  visibleTypes: PropTypes.array.isRequired,
};

export default DownloadButton;
