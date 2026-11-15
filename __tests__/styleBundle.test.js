import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec';
import { defaultLayerSpecs, inspectLayerSpecs } from '@/components/map';
import { buildStyleBundle, findUnresolvedRefs } from '@/lib/styleBundle';

const variants = { explore: defaultLayerSpecs, inspect: inspectLayerSpecs };
const bundle = buildStyleBundle({ variants });
const entries = Object.entries(bundle.collections);
const styles = entries.flatMap(([key, c]) => Object.entries(c.styles).map(([variant, style]) => [key, variant, style]));

describe('style bundle', () => {
  it('has one collection per theme/type in the layer specs', () => {
    const expected = new Set(
      [...defaultLayerSpecs, ...inspectLayerSpecs]
        .filter((s) => s.metadata?.['overture:theme'])
        .map((s) => `${s.metadata['overture:theme']}/${s.metadata['overture:type']}`)
    );
    expect(Object.keys(bundle.collections).sort()).toEqual([...expected].sort());
  });

  it('places every collection layer in exactly one style, in manifest order', () => {
    for (const [variant, specs] of Object.entries(variants)) {
      const collectionSpecs = specs.filter((s) => s.metadata?.['overture:theme']);
      const bundled = styles.filter(([, v]) => v === variant).flatMap(([, , style]) => style.layers.map((l) => l.id));
      expect(bundled.sort()).toEqual(collectionSpecs.map((s) => s.id).sort());
    }
    for (const [key, variant, style] of styles) {
      const order = style.layers.map((l) => l.id);
      const manifest = variants[variant].map((s) => s.id).filter((id) => order.includes(id));
      expect([key, order]).toEqual([key, manifest]);
    }
  });

  it('only puts a collection\'s own layers in its styles', () => {
    for (const [key, , style] of styles) {
      for (const layer of style.layers) {
        expect(`${layer.metadata['overture:theme']}/${layer.metadata['overture:type']}`).toBe(key);
      }
    }
  });

  it('produces valid standalone MapLibre styles', () => {
    for (const [key, variant, style] of styles) {
      const errors = validateStyleMin(style);
      expect([key, variant, errors]).toEqual([key, variant, []]);
    }
  });

  it('leaves no unresolved token references', () => {
    expect(findUnresolvedRefs(bundle)).toEqual([]);
    expect(findUnresolvedRefs({ paint: { color: '$unresolved' } })).toEqual(['paint.color']);
  });

  it('points every source at its theme PMTiles with the release placeholder', () => {
    for (const [, , style] of styles) {
      for (const [name, source] of Object.entries(style.sources)) {
        expect(source.url).toBe(`pmtiles://https://tiles.overturemaps.org/{release}/${name}.pmtiles`);
      }
      for (const layer of style.layers) {
        expect(style.sources).toHaveProperty(layer.source);
      }
    }
  });

  it('defaults to the first variant that styles the collection', () => {
    for (const [key, c] of entries) {
      const first = Object.keys(variants).find((v) => c.styles[v]);
      expect([key, c.default]).toEqual([key, first]);
    }
  });

  it('sets glyphs and sprite only when given', () => {
    const [, , style] = styles[0];
    expect(style).not.toHaveProperty('glyphs');
    expect(style).not.toHaveProperty('sprite');

    const withAssets = buildStyleBundle({ variants, glyphs: 'https://g/{fontstack}/{range}.pbf', sprite: 'https://s/sprite' });
    for (const c of Object.values(withAssets.collections)) {
      for (const s of Object.values(c.styles)) {
        expect(s.glyphs).toBe('https://g/{fontstack}/{range}.pbf');
        expect(s.sprite).toBe('https://s/sprite');
      }
    }
  });

  it('rejects a tiles URL without the release placeholder', () => {
    expect(() => buildStyleBundle({ variants, tilesUrl: 'pmtiles://x/{theme}.pmtiles' })).toThrow('{release}');
  });

  it('rejects a tiles URL without the theme placeholder', () => {
    expect(() => buildStyleBundle({ variants, tilesUrl: 'pmtiles://x/{release}/tiles.pmtiles' })).toThrow('{theme}');
  });

  it('does not mutate the app layer specs', () => {
    const before = JSON.stringify(defaultLayerSpecs);
    const b = buildStyleBundle({ variants });
    b.collections['base/water'].styles.explore.layers[0].paint = {};
    expect(JSON.stringify(defaultLayerSpecs)).toBe(before);
  });
});
