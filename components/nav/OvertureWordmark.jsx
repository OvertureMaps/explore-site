const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

export default function OvertureWordmark() {
  return (
    <a
      href="https://overturemaps.org"
      target="_blank"
      rel="noopener noreferrer"
      className="wordmark"
      style={{ display: "flex", alignItems: "center", textDecoration: "none", color: "inherit" }}
    >
      <img
        src="/omf_logo_transparent.png"
        alt="Overture Maps Foundation Logo"
        className="logo"
        style={{ height: "2.5em", padding: "0.25em" }}
      />
      <b className="tour-homepage" style={{ whiteSpace: "nowrap" }}>Overture Maps Explorer</b>
    </a>
  );
}
