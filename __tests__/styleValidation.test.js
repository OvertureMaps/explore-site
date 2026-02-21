import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { geometryLayers, labelLayers, divisionLabelSpec } from '@/lib/map-styles';

const allSpecs = [...geometryLayers, ...labelLayers, divisionLabelSpec];

// Build a minimal valid style that includes all layers with their sources,
// so the validator can cross-reference source-layer against source definitions.
function buildTestStyle(layerSpecs) {
  const sourceNames = new Set(layerSpecs.map((s) => s.source));
  const sources = {};
  for (const name of sourceNames) {
    sources[name] = { type: 'vector', url: 'pmtiles://test' };
  }

  return {
    version: 8,
    sources,
    layers: layerSpecs.map((spec) => {
      // Strip custom metadata — the validator doesn't know about overture:* keys
      // inside the metadata object, but metadata is a free-form object in the spec
      // so it should pass. Clone to avoid mutating imports.
      return { ...spec };
    }),
  };
}

describe('MapLibre style spec validation', () => {
  it('all layer specs are valid MapLibre layers', () => {
    const style = buildTestStyle(allSpecs);
    const errors = validateStyleMin(style);

    // Filter out warnings about missing glyphs (we set them at runtime)
    const realErrors = errors.filter(
      (e) => !e.message.includes('use of "text-field" requires a style "glyphs" property')
    );

    expect(realErrors).toEqual([]);
  });

  it('every layer has a valid id', () => {
    const ids = allSpecs.map((s) => s.id);
    // No empty IDs
    ids.forEach((id) => {
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
    // No duplicate IDs
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every layer has overture:theme metadata', () => {
    allSpecs.forEach((spec) => {
      expect(spec.metadata).toBeDefined();
      expect(spec.metadata['overture:theme']).toBeDefined();
      expect(spec.metadata['overture:type']).toBeDefined();
      expect(spec.metadata['overture:pass']).toMatch(/^(geometry|labels|division-labels)$/);
    });
  });

  it('geometry layers have overture:color metadata', () => {
    geometryLayers.forEach((spec) => {
      // Click buffers don't carry color metadata
      if (spec.id.includes('click-buffer')) return;
      expect(spec.metadata['overture:color']).toBeDefined();
    });
  });

  it('each layer spec has required MapLibre fields', () => {
    allSpecs.forEach((spec) => {
      expect(spec).toHaveProperty('id');
      expect(spec).toHaveProperty('type');
      expect(spec).toHaveProperty('source');
      expect(spec).toHaveProperty('source-layer');
      expect(spec).toHaveProperty('paint');
    });
  });

  it('validates each layer individually against the spec', () => {
    allSpecs.forEach((spec) => {
      const style = buildTestStyle([spec]);
      const errors = validateStyleMin(style);
      const realErrors = errors.filter(
        (e) => !e.message.includes('"glyphs" property')
      );
      expect(realErrors).toEqual([]);
    });
  });
});
