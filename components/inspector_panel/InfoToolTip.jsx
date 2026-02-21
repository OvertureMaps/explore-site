import PropTypes from "prop-types";
import Floater from "react-floater";
import InfoIcon from "@/components/icons/icon-info.svg?react";
import { useState } from "react";
import "./InfoToolTip.css";

function InfoToolTip({ mode, target, content }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={"tool-tip"}>
      <Floater
        className={open ? "info-floater-open" : "info-floater-closed"}
        styles={{
          container: {
            padding: "10px",
            color: mode === "theme-dark" ? "white" : "black",
            fontSize: ".8rem",
            background:
              mode === "theme-dark"
                ? "var(--ifm-navbar-background-color)"
                : "var(--ifm-color-secondary-light)",
            display: open ? "block" : "none",
          },
          arrow: {
            color:
              mode === "theme-dark"
                ? "var(--ifm-navbar-background-color)"
                : "var(--ifm-color-secondary-light)",
          },
        }}
        content={<div>{content}</div>}
        target={"." + target}
        open={open}
        placement={"right"}
      >
        <button
          className={target + " tool-tip"}
          onMouseOver={() => setOpen(true)}
          onMouseOut={() => setOpen(false)}
          disabled={true}
        >
          <InfoIcon />
        </button>
      </Floater>
    </div>
  );
}

InfoToolTip.propTypes = {
  mode: PropTypes.string.isRequired,
  target: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
};

export default InfoToolTip;
