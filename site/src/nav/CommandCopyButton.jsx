import { useMap } from "react-map-gl/maplibre";
import { useEffect, useState } from "react";
import CopyIcon from "../icons/icon-copy.svg?react";
import Floater from "react-floater";

const ZOOM_BOUND = 16;

function CommandCopyButton({ mode, zoom, setZoom, visibleThemes }) {
  const { myMap } = useMap();

  const [showFloater, setShowFloater] = useState(false);
  const [commands, setCommands] = useState([]);

  useEffect(() => {
    if (myMap) {
      myMap.getBounds();
      setZoom(myMap.getZoom());
    }
  });
  const handleClick = () => {
    const bounds = myMap.getBounds();
    let bbox = [
      bounds.getWest(), //minx
      bounds.getSouth(), //miny
      bounds.getEast(), //maxx
      bounds.getNorth(), //maxy
    ];

    console.log(
      "overturemaps download --bbox: " + bbox + " -f: geojson --type: "
    );

    setShowFloater(!showFloater);
  };

  return (
    <div>
      <Floater
        styles={{}}
        content={
          <div>
            Use these commands with the{" "}
            <a
              href={"https://github.com/OvertureMaps/overturemaps-py"}
              target="_blank"
              rel="noreferrer noopener"
            >
              python downloader
            </a>
            to download the current layers:
          </div>
        }
        open={showFloater}
        target={".copy-command-button"}
      />
      <button className="copy-command-button" onClick={handleClick}>
        <CopyIcon />
      </button>
    </div>
  );
}

export default CommandCopyButton;
