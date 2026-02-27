import PropTypes from "prop-types";
import { useMapInstance } from "@/lib/MapContext";
import { useEffect, useState } from "react";
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

const ZOOM_BOUND = 15;
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function DownloadButton({ mode, zoom, setZoom, visibleTypes}) {
  const map = useMapInstance();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (map) {
      map.getBounds();
      setZoom(map.getZoom());
    }
  }, [map, setZoom]);

  const handleDownloadClick = async () => {
    if (!map) return;

    //TODO: Make this async and parallelize with the startup of the map component, rather than blocking in.
    await initWasm();


    setLoading(true);
    try {
      //Get current map dimensions and convert to bbox
      const bounds = map.getBounds();
      let bbox = [
        bounds.getWest(),  //xmin
        bounds.getSouth(), //ymin
        bounds.getEast(),  //xmax
        bounds.getNorth(), //ymax
      ];

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

      await Promise.all(datasets)
        .then((datasets) => {
          return datasets.map((dataset) =>
            dataset.parquet.read(readOptions).then((reader) => {
              return { type: dataset.type, reader: reader };
            })
          );
        })
        .then((tableReads) =>
          Promise.all(tableReads)
            .then((wasmTables) => {
              wasmTables.map((wasmTable) => {
                if (wasmTable?.reader?.numBatches > 0) {
                  const binaryDataForDownload = writeGeoJSON(wasmTable.reader);

                  let blerb = new Blob([binaryDataForDownload], {
                    type: "application/octet-stream",
                  });

                  const url = URL.createObjectURL(blerb);
                  var downloadLink = document.createElement("a");
                  downloadLink.href = url;

                  const center = map.getCenter();
                  const zoom = map.getZoom();
                  downloadLink.download = `overture-${releaseVersion}-${wasmTable.type}-${zoom}-${center.lat}-${center.lng}.geojson`;

                  document.body.appendChild(downloadLink);
                  downloadLink.click();
                  document.body.removeChild(downloadLink);
                }
              });
            })
            .then(() => {
              setLoading(false);
            })
        ).catch(error => {
          // Something went wrong with the download.
          console.error("An error occurred during the download:", error);
          alert("An error occurred during the download. Please try again.");
        });
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

  return downloadIcon;
}

DownloadButton.propTypes = {
  mode: PropTypes.string.isRequired,
  zoom: PropTypes.number.isRequired,
  setZoom: PropTypes.func.isRequired,
  visibleTypes: PropTypes.array.isRequired,
};

export default DownloadButton;
