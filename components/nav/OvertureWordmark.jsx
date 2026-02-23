const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function OvertureWordmark() {
  return (
    <a
      href="https://overturemaps.org"
      target="_blank"
      rel="noopener noreferrer"
      className="navbar__brand"
    >
      <div className="navbar__logo">
        <img src={`${basePath}/omf_logo_transparent.png`} alt="Overture Maps Foundation Logo" />
      </div>
      <b className="navbar__title tour-homepage">Overture Maps Explorer</b>
    </a>
  );
}
