import { layers } from '@/lib/Layers';

describe('Layer definitions', () => {
  it('has layers defined', () => {
    expect(layers.length).toBeGreaterThan(0);
  });

  it('every layer has required properties', () => {
    layers.filter((l) => l.theme).forEach((layer, i) => {
      expect(layer).toHaveProperty('theme', expect.any(String));
      expect(layer).toHaveProperty('type', expect.any(String));
      expect(layer).toHaveProperty('color');
    });
  });

  it('every layer has at least one geometry type', () => {
    const geomTypes = ['point', 'line', 'polygon', 'outline', 'extrusion'];
    layers.filter((l) => l.theme).forEach((layer) => {
      const hasGeom = geomTypes.some((g) => layer[g] === true);
      expect(hasGeom).toBe(true);
    });
  });

  it('contains expected themes', () => {
    const themes = [...new Set(layers.map((l) => l.theme).filter(Boolean))];
    expect(themes).toContain('base');
    expect(themes).toContain('buildings');
    expect(themes).toContain('places');
    expect(themes).toContain('transportation');
    expect(themes).toContain('divisions');
  });
});
