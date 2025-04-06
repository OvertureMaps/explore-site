import PropTypes from "prop-types";
import { useMap } from "react-map-gl/maplibre";
import { useEffect, useState } from "react";
import { getDownloadCatalog } from "../DownloadCatalog.js";
import {
  ParquetDataset,
  set_panic_hook,
  writeGeoJSON,
} from "@geoarrow/geoarrow-wasm/esm/index.js";
import downloadIcon from "/download.svg";
import RefreshIcon from "../icons/icon-refresh.svg?react";
import "./DownloadButton.css";
import Floater from "react-floater";
import CloseIcon from "@mui/icons-material/Close";

const ZOOM_BOUND = 15;

function DownloadButton({ mode, zoom, setZoom, visibleTypes}) {
  const { leftMap } = useMap();

  const [loading, setLoading] = useState(false);
  const [showFloater, setShowFloater] = useState(false);

  useEffect(() => {
    if (leftMap) {
      leftMap.getBounds();
      setZoom(leftMap.getZoom());
    }
  }, [leftMap]);

  const handleDownloadClick = async () => {
    setLoading(true);
    //Get current map dimensions and convert to bbox
    const bounds = leftMap.getBounds();
    let bbox = [
      bounds.getWest(), //minx
      bounds.getSouth(), //miny
      bounds.getEast(), //maxx
      bounds.getNorth(), //maxy
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
    let downloadCatalog = getDownloadCatalog(bbox, visibleTypes);

    set_panic_hook();

    // The catalog contains a base path and then a list of types with filenames.
    //First, assemble the parquet datasets in parallel.
    let datasets = downloadCatalog.types.map((type) => {
      return new ParquetDataset(downloadCatalog.basePath, type.files).then(
        (dataset) => {
          return { type: type.name, parquet: dataset };
        }
      );
    });

    Promise.all(datasets)
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

                const center = leftMap.getCenter();
                const zoom = leftMap.getZoom();
                downloadLink.download = `overture-${wasmTable.type}-${zoom}-${center.lat}-${center.lng}.geojson`;

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
        alert("An error occurred during the download: " + error);
      });
  };

  const handleToggleTooltip = () => {
    if (zoom < ZOOM_BOUND) {
      setShowFloater(!showFloater);
    }
  };

  return (
    <div>
      <Floater
        styles={{
          container: {
            borderRadius: "10px",
            padding: "6px",
            color: mode === "theme-dark" ? "white" : "black",
            fontSize: ".7rem",
            background:
              mode === "theme-dark"
                ? "var(--ifm-navbar-background-color)"
                : "var(--ifm-color-secondary-light)",
          },
          arrow: {
            color:
              mode === "theme-dark"
                ? "var(--ifm-navbar-background-color)"
                : "var(--ifm-color-secondary-light)",
          },
        }}
        content={
          <div className={`${mode} info-floater`}>
            <div className="floater-text">
              The download button is disabled at zoom levels below {ZOOM_BOUND}.
              This is done to prevent downloading large amounts of data. To
              reenable the button, zoom further in. If you wish to download a
              larger area of data points, consider using our python installer,
              found at{" "}
              <a
                href={"https://github.com/OvertureMaps/overturemaps-py"}
                target="_blank"
                rel="noreferrer noopener"
              >
                our git repository
              </a>
              .
            </div>
            <button
              className="close-panel-button"
              onClick={() => setShowFloater(false)}
              style={{ height: "22px", width: "22px", marginLeft: "2px" }}
            >
              <CloseIcon
                sx={{ fontSize: "22px" }}
                className="close-panel-icon"
              />
            </button>
          </div>
        }
        open={showFloater}
        target={".button--download"}
      />
      <div className="button--download" onMouseDown={handleToggleTooltip}>
        <button
          className={`button button--primary ${
            loading || zoom < ZOOM_BOUND ? "disabled" : ""
          }`}
          onClick={handleDownloadClick}
        >
          <div className="wrapper tour-download">
            <div className="download-icon">
              {!loading ? (
                <img className={"dl-img"} src={downloadIcon} />
              ) : (
                <RefreshIcon />
              )}
            </div>
            <div className="download-text">
              {loading ? "Downloading..." : "Download Visible"}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}

export default DownloadButton;
