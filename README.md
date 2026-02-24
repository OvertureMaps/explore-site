<h1 align="center">The Overture Maps Explore site</h1>

The Explore Site is a web-based map viewer designed for accessible downloading of geospatial data. io-site allows for the downloading of small segments of geospatial data so that small and independent customers are able to withstand the size of the incoming data. The site also facilitates easy viewing of geospatial data by translating complex vectors and properties to a more user-friendly, readable format.

The data accessible through the site is drawn from the [Overture Maps Foundation](https://overturemaps.org/). This data is collected through open source avenues, and as such provides a free, low barrier to entry to mappers to download global data.

## Participate!

- Read the project [Contributing Guide](CONTRIBUTING.md) to learn about how to contribute.
- See [open issues in the issue tracker](https://github.com/OvertureMaps/explore-site/issues?q=is%3Aissue+is%3Aopen+) if you're looking to help on issues.

- The current build of the `main` branch is publicly available [here](https://explore.overturemaps.org/#16.34/51.049194/3.728993)!

- For the tilesets that power the site, see the [overture-tiles repository](https://github.com/OvertureMaps/overture-tiles).

## For developers

### Prerequisites

- [Node.js](https://nodejs.org/en/download/package-manager) (v20+)
- [Volta](https://volta.sh/) is configured in `package.json` and recommended for automatic Node version management

### Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Available scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the development server |
| `npm run build` | Build static export to `out/` |
| `npm start` | Start the Next.js production server |
| `npm run preview` | Serve the static export from `out/` locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run unit tests |
| `npm run test:ci` | Run tests in CI mode |

### Testing

Tests use [Jest](https://jestjs.io/) with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) and run in a jsdom environment.

```bash
npm test
```

Test files are located in `__tests__/` and mock files for SVG and style imports are in `__mocks__/`.

### Tech stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, static export)
- **Mapping:** [MapLibre GL JS](https://maplibre.org/) via [react-map-gl](https://visgl.github.io/react-map-gl/)
- **Tiles:** [PMTiles](https://protomaps.com/docs/pmtiles) served from [STAC catalog](https://stac.overturemaps.org/catalog.json)
- **UI:** [MUI](https://mui.com/) (Material UI)
- **Testing:** [Jest](https://jestjs.io/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)

### Deployment

- **Production:** Pushes to `main` are automatically built and deployed to [GitHub Pages](https://explore.overturemaps.org/).
- **Staging:** Pull requests against `main` are built and deployed to an AWS S3/CloudFront staging environment.

Both workflows run linting and tests before deploying.

### Project structure

```
app/            Next.js App Router (layout, page, global CSS)
components/     React components
  nav/          Header, download, dark mode toggle
  inspector_panel/  Feature property inspector
  navigator/    Bookmark locations
  icons/        SVG icons
lib/            Shared utilities and data
  map-styles/   MapLibre layer definitions and style variables
    variables.json   Centralized style variables (colors, fonts, sizes)
    layer-order.json Layer rendering order
    index.js         Imports all layers, resolves variable references
    addresses/       Address layer specs
    base/            Base layer specs (land, water, infrastructure, etc.)
    buildings/       Building layer specs
    divisions/       Division layer specs
    places/          Place layer specs
    transportation/  Transportation layer specs
  Layers.js     Abstract layer definitions derived from specs
  LayerManager.js  Runtime layer add/update/visibility logic
  stacService.js  STAC catalog integration
  themeUtils.js   Dark/light mode
__tests__/      Unit tests
__mocks__/      Jest mocks (SVG, styles)
public/         Static assets
```

### Map style system

Layer styles are defined as individual JSON files in `lib/map-styles/<theme>/`. Each file is a valid [MapLibre style layer](https://maplibre.org/maplibre-style-spec/layers/) with additional `overture:*` metadata.

#### Variables

`lib/map-styles/variables.json` stores shared style values in a nested `theme → type → property` structure:

```json
{
  "global": {
    "colors": { "background": "...", "textHalo": "..." },
    "fonts":  { "regular": ["Noto Sans Regular"], "sizeSm": 10, "sizeMd": 11 }
  },
  "base": {
    "water":      { "color": "...", "activeColor": "...", "textColor": "...", ... },
    "land_cover": { "color": [...], ... }
  },
  ...
}
```

Layer JSON files reference variables with the syntax `"$theme.type.property"`:

```json
{
  "paint": {
    "fill-color": "$base.water.color",
    "text-color": "$base.water.textColor"
  },
  "layout": {
    "text-font": "$global.fonts.regular",
    "text-size": "$global.fonts.sizeMd"
  }
}
```

At import time, `index.js` resolves all `$`-references to their actual values from `variables.json`.

#### Layer IDs

Each layer's `id` matches its filename without `.json` (e.g., `base/land-cover-fill.json` has `"id": "land-cover-fill"`). The rendering order is defined in `layer-order.json`.

## License

See the [LICENSE.md](LICENSE.md) file for more details.
