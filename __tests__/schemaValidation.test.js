import { defaultLayerSpecs } from '@/components/map';
import { collectFieldRefs, collectFilterValues } from '@/lib/styleValidation';
import schema from '@/components/map/schema.json';
import tiles from '@/components/map/tiles.json';

// ── Build lookup maps ────────────────────────────────

const tileLayerMap = new Map();
for (const [theme, themeData] of Object.entries(tiles.themes)) {
  for (const [layerId, layerData] of Object.entries(themeData.layers)) {
    tileLayerMap.set(`${theme}:${layerId}`, layerData);
  }
}

const schemaTypeMap = new Map();
for (const [theme, themeData] of Object.entries(schema.themes)) {
  for (const [type, typeData] of Object.entries(themeData.types)) {
    schemaTypeMap.set(`${theme}:${type}`, typeData);
  }
}

function getSchemaValues(typeData) {
  const vals = new Set();
  if (typeData.subtypes) typeData.subtypes.forEach((s) => vals.add(s));
  if (typeData.classes) typeData.classes.forEach((c) => vals.add(c));
  if (typeData.road_classes) typeData.road_classes.forEach((c) => vals.add(c));
  if (typeData.rail_classes) typeData.rail_classes.forEach((c) => vals.add(c));
  return vals;
}

// Filter to layers that reference tile sources (skip background, etc.)
const layersWithSource = defaultLayerSpecs.filter(
  (s) => s.source && s['source-layer']
);

// ── Data file integrity ──────────────────────────────

describe('Data file integrity', () => {
  it('schema.json has expected structure', () => {
    expect(schema).toHaveProperty('$generated');
    expect(schema).toHaveProperty('$release');
    expect(schema).toHaveProperty('defs');
    expect(schema).toHaveProperty('themes');
    expect(Object.keys(schema.themes).length).toBeGreaterThan(0);
  });

  it('tiles.json has expected structure', () => {
    expect(tiles).toHaveProperty('$generated');
    expect(tiles).toHaveProperty('$release');
    expect(tiles).toHaveProperty('themes');
    expect(Object.keys(tiles.themes).length).toBeGreaterThan(0);
  });

  it('every tile theme has layers with fields', () => {
    for (const [theme, themeData] of Object.entries(tiles.themes)) {
      expect(themeData).toHaveProperty('layers');
      for (const [layer, layerData] of Object.entries(themeData.layers)) {
        expect(layerData).toHaveProperty('fields');
        expect(layerData).toHaveProperty('minzoom');
        expect(layerData).toHaveProperty('maxzoom');
      }
    }
  });
});

// ── Source-layer existence ────────────────────────────

describe('Source-layer existence', () => {
  it.each(
    layersWithSource.map((s) => [s.id, s.source, s['source-layer']])
  )('%s — %s:%s exists in tiles.json', (id, source, sourceLayer) => {
    const key = `${source}:${sourceLayer}`;
    expect(tileLayerMap.has(key)).toBe(true);
  });
});

// ── Zoom range ───────────────────────────────────────

describe('Zoom range', () => {
  const layersWithMinzoom = layersWithSource.filter(
    (s) => s.minzoom !== undefined
  );

  it.each(
    layersWithMinzoom.map((s) => {
      const tileLayer = tileLayerMap.get(`${s.source}:${s['source-layer']}`);
      return [s.id, s.minzoom, tileLayer?.minzoom ?? 0];
    })
  )('%s — minzoom %d >= tile minzoom %d', (id, layerMin, tileMin) => {
    expect(layerMin).toBeGreaterThanOrEqual(tileMin);
  });
});

// ── Field references ─────────────────────────────────

// Fields that exist in tiles but aren't listed in PMTiles metadata for a
// specific source-layer. These are known data quirks, not style bugs.
const FIELD_ALLOWLIST = {
  'buildings:building_part': new Set(['has_parts']),
};

describe('Field references', () => {
  it.each(
    layersWithSource.map((s) => [s.id, s])
  )('%s — all field refs exist in tile spec', (id, spec) => {
    const tileLayer = tileLayerMap.get(`${spec.source}:${spec['source-layer']}`);
    if (!tileLayer) return; // source-layer existence tested separately

    const allowed = FIELD_ALLOWLIST[`${spec.source}:${spec['source-layer']}`] || new Set();
    const fields = new Set();
    collectFieldRefs(spec.filter, fields);
    collectFieldRefs(spec.paint, fields);
    collectFieldRefs(spec.layout, fields);

    const missing = [];
    for (const field of fields) {
      if (field.startsWith('$') || field.startsWith('@') || field === 'geometry-type') continue;
      if (!tileLayer.fields[field] && !allowed.has(field)) {
        missing.push(field);
      }
    }
    expect(missing).toEqual([]);
  });
});

// ── Filter values vs schema enums ────────────────────

describe('Filter values vs schema enums', () => {
  const layersWithSchemaEnums = layersWithSource.filter((s) => {
    const typeData = schemaTypeMap.get(`${s.source}:${s['source-layer']}`);
    return typeData && getSchemaValues(typeData).size > 0;
  });

  it.each(
    layersWithSchemaEnums.map((s) => [s.id, s])
  )('%s — filter values match schema enums', (id, spec) => {
    const typeData = schemaTypeMap.get(`${spec.source}:${spec['source-layer']}`);
    const schemaVals = getSchemaValues(typeData);

    const filterVals = new Set();
    collectFilterValues(spec.filter, 'subtype', filterVals);
    collectFilterValues(spec.filter, 'class', filterVals);

    const invalid = [];
    for (const val of filterVals) {
      if (!schemaVals.has(val)) {
        invalid.push(val);
      }
    }
    expect(invalid).toEqual([]);
  });
});

// ── Metadata consistency ─────────────────────────────

describe('Metadata consistency', () => {
  it.each(
    layersWithSource.map((s) => [s.id, s])
  )('%s — overture:theme matches source', (id, spec) => {
    const meta = spec.metadata || {};
    if (meta['overture:theme']) {
      expect(meta['overture:theme']).toBe(spec.source);
    }
  });

  it.each(
    layersWithSource.map((s) => [s.id, s])
  )('%s — overture:type matches source-layer', (id, spec) => {
    const meta = spec.metadata || {};
    if (meta['overture:type']) {
      expect(meta['overture:type']).toBe(spec['source-layer']);
    }
  });
});

// ── Coverage tracking (informational) ────────────────

describe('Schema coverage', () => {
  it('logs coverage summary', () => {
    let totalVals = 0;
    let totalStyled = 0;

    for (const [theme, themeData] of Object.entries(schema.themes)) {
      for (const [type, typeData] of Object.entries(themeData.types)) {
        const allEnums = [
          ...(typeData.subtypes || []),
          ...(typeData.classes || []),
          ...(typeData.road_classes || []),
          ...(typeData.rail_classes || []),
        ];
        if (allEnums.length === 0) continue;

        const usedValues = new Set();
        for (const spec of layersWithSource) {
          if (spec.source !== theme || spec['source-layer'] !== type) continue;
          collectFilterValues(spec.filter, 'subtype', usedValues);
          collectFilterValues(spec.filter, 'class', usedValues);
        }

        totalVals += allEnums.length;
        totalStyled += allEnums.filter((v) => usedValues.has(v)).length;
      }
    }

    const pct = totalVals > 0 ? Math.round((totalStyled / totalVals) * 100) : 0;
    console.log(`Schema coverage: ${totalStyled}/${totalVals} values styled (${pct}%)`);
    expect(true).toBe(true);
  });
});
