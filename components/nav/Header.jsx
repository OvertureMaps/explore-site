import DownloadButton from "@/components/nav/DownloadButton";
import OvertureWordmark from "@/components/nav/OvertureWordmark";
import DarkModeToggle from "@/components/nav/DarkModeToggle";
import LanguageSwitcher from "@/components/nav/LanguageSwitcher";
import PropTypes from "prop-types";
import GithubButton from "@/components/nav/GithubButton";

export default function Header({ zoom, mode, setMode, setZoom, visibleTypes, language, setLanguage, inspectMode, setInspectMode, globeMode, setGlobeMode }) {
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
          <a
            href="https://github.com/OvertureMaps/explore-site/issues/new/choose"
            target="_blank"
            rel="noopener noreferrer"
            className="navbar__item bug-report-link"
            aria-label="Report a bug"
            title="Report a bug"
          >
            <span className="material-symbols-outlined">bug_report</span>
          </a>
          <button
            className={`navbar__item inspect-toggle${inspectMode ? " active" : ""}`}
            onClick={() => setInspectMode(!inspectMode)}
            aria-label="Toggle inspect mode"
            title="Toggle inspect mode"
          >
            <span className="material-symbols-outlined">frame_inspect</span>
          </button>
          <button
            className={`navbar__item globe-toggle${globeMode && zoom < 6 ? " active" : ""}`}
            onClick={() => setGlobeMode(!globeMode)}
            aria-label="Toggle globe view"
            title="Toggle globe view"
            disabled={zoom >= 6}
          >
            <span className="material-symbols-outlined">globe_asia</span>
          </button>
          <DarkModeToggle mode={mode} setMode={setMode} />
          <LanguageSwitcher language={language} setLanguage={setLanguage} />
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
  language: PropTypes.string.isRequired,
  setLanguage: PropTypes.func.isRequired,
  inspectMode: PropTypes.bool.isRequired,
  setInspectMode: PropTypes.func.isRequired,
  globeMode: PropTypes.bool.isRequired,
  setGlobeMode: PropTypes.func.isRequired,
};
