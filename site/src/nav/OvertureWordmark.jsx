import overtureLogo from "/omf_logo_transparent.png";

export default function OvertureWordmark() {
  return (
    <a
      href="https://overturemaps.org"
      target="_blank"
      rel="noopener noreferrer"
      className="navbar__brand"
    >
      <div className="navbar__logo">
        <img src={overtureLogo} alt="Overture Maps Foundation Logo" />
      </div>
      <b className="navbar__title tour-homepage">Overture Maps QA Console</b>
    </a>
  );
}
