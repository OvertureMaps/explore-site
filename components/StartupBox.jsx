import PropTypes from "prop-types";
import { Checkbox, FormControlLabel, Box, Modal } from "@mui/material";
import "./StartupBox.css";

function StartupBox({
  open,
  setOpen,
  startTour,
  updateTour,
  mode,
  setNavigatorOpen,
}) {
  const handleSkip = () => {
    setOpen(false);
    setNavigatorOpen(true);
  };
  return (
    <div className="startup-modal">
      <Modal open={open} onClose={handleSkip}>
        <div
          className={`${
            mode === "theme-dark" ? "startup-box-dark" : "startup-box-light"
          }`}
        >
          <Box>
            <p
              className={`tool-intro ${
                mode === "theme-dark" ? "dark-startup" : "light-startup"
              }`}
            >
              <strong>Overture Maps Explorer</strong> is a tool for inspecting
              and downloading Overture data.
            </p>
            <p
              className={`tour-intro ${
                mode === "theme-dark" ? "dark-startup" : "light-startup"
              }`}
            >
              New here? Take the tour to get started!
            </p>
            <div className="tour-buttons">
              <button className="button start" onClick={startTour}>
                Begin
              </button>
              <button className="button skip" onClick={handleSkip}>
                Skip
              </button>
            </div>
            <div className="perma-skip">
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={updateTour}
                    sx={mode === "theme-dark" ? { color: "whitesmoke" } : {}}
                  />
                }
                label="Don't Ask Me This Again"
                sx={
                  mode === "theme-dark"
                    ? { color: "whitesmoke" }
                    : { color: "#213547" }
                }
              />
            </div>
          </Box>
        </div>
      </Modal>
    </div>
  );
}

StartupBox.propTypes = {
  open: PropTypes.bool.isRequired,
  setOpen: PropTypes.func.isRequired,
  startTour: PropTypes.func.isRequired,
  updateTour: PropTypes.func.isRequired,
  mode: PropTypes.string.isRequired,
  setNavigatorOpen: PropTypes.func.isRequired,
};

export default StartupBox;
