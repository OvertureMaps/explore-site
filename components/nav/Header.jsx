import DownloadButton from "@/components/nav/DownloadButton";
import OvertureWordmark from "@/components/nav/OvertureWordmark";
import DarkModeToggle from "@/components/nav/DarkModeToggle";
import PropTypes from "prop-types";
import GithubButton from "@/components/nav/GithubButton";

export default function Header({ zoom, mode, setMode, setZoom, visibleTypes}) {
  return (
    <nav aria-label="Main" className="navbar navbar--fixed-top">
      <div className="navbar__inner">
        <div className="navbar__items">
          <OvertureWordmark />
          <a
            aria-current="page"
            className="navbar__item navbar__link"
            href="https://docs.overturemaps.org/"
            target="_blank"
          >
            Docs
          </a>
        </div>
        <div className="navbar__items navbar__items--right">
          <GithubButton />
          <DarkModeToggle mode={mode} setMode={setMode} />
          <DownloadButton zoom={zoom} mode={mode} setZoom={setZoom} visibleTypes={visibleTypes}/>
        </div>
      </div>
    </nav>
  );
}

Header.propTypes = {
  zoom: PropTypes.number.isRequired,
  mode: PropTypes.string.isRequired,
  setMode: PropTypes.func.isRequired,
  setZoom: PropTypes.func.isRequired,
  visibleTypes: PropTypes.array.isRequired,
};
