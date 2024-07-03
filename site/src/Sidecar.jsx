import "./Sidecar.css";
import CloseIcon from "@mui/icons-material/Close";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

function Sidecar({ open, setOpen, map, setVisibleThemes }) {
  const handleParis = () => {
    setVisibleThemes(["base", "transportation"]);
    map.ref.current.easeTo({
      center: [2.3417, 48.8552],
      zoom: 11.73,
      pitch: 12,
      bearing: 15.3,
    });
  };

  const handleNYC = () => {
    setVisibleThemes(["base", "buildings"]);
    map.ref.current.easeTo({
      center: [-73.99768, 40.75332],
      zoom: 14.22,
      pitch: 60,
      bearing: 60.6,
    });
  };
  const handleVenice = () => {
    setVisibleThemes(["base"]);
    map.ref.current.easeTo({
      center: [12.32545, 45.4299],
      zoom: 13.36,
      pitch: 52,
      bearing: 14.5,
    });
  };
  const handleLondon = () => {
    setVisibleThemes(["base", "places"]);
    map.ref.current.easeTo({
      center: [-0.091217, 51.514511],
      zoom: 16.02,
      bearing: -24,
      pitch: 50,
    });
  };
  return (
    <>
      {open ? (
        <div className="sidecar-modal">
          <div className="sidecar-box">
            <div className="sidecar-landing">
              <p className="sidecar-welcome">WELCOME</p>
              <button
                className="close-panel-button"
                onClick={() => setOpen(false)}
              >
                <CloseIcon className="close-panel-icon" />
              </button>
            </div>
            <div className="sidecar-header">Explore Overture</div>
            <div className="sidecar-blurb">
              Initially, we are focusing on layers for transportation, places,
              3D buildings, and administrative.
            </div>
            <div className="sidecar-container">
              <div className="sidecar-option paris">
                {" "}
                <button className="sidecar-option" onClick={handleParis}>
                  <ArrowForwardIosIcon className="arrow-forward" />
                  Paris Roads
                </button>
              </div>
              <div className="sidecar-option nyc">
                <button className="sidecar-option" onClick={handleNYC}>
                  <ArrowForwardIosIcon className="arrow-forward" />
                  NYC Buildings
                </button>
              </div>
              <div className="sidecar-option venice">
                <button className="sidecar-option" onClick={handleVenice}>
                  <ArrowForwardIosIcon className="arrow-forward" />
                  Venice Landcover
                </button>
              </div>
              <div className="sidecar-option london">
                <button className="sidecar-option" onClick={handleLondon}>
                  <ArrowForwardIosIcon className="arrow-forward" />
                  London Places
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <></>
      )}{" "}
    </>
  );
}

export default Sidecar;
