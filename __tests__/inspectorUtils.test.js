import { processActiveFeature } from '@/components/inspector_panel/utils/EntityProcessor';
import { extractPanelTitle } from '@/components/inspector_panel/utils/PanelTitleExtractor';
import { createOrderedKeys } from '@/components/inspector_panel/utils/PropertyOrderer';

describe('EntityProcessor', () => {
  it('returns null for null input', () => {
    expect(processActiveFeature(null)).toBeNull();
  });

  it('extracts theme and type from feature', () => {
    const feature = {
      source: 'buildings',
      sourceLayer: 'building',
      properties: { id: '123', height: 50 },
    };
    const result = processActiveFeature(feature);
    expect(result.theme).toBe('buildings');
    expect(result.type).toBe('building');
    expect(result.id).toBe('123');
    expect(result.height).toBe(50);
  });
});

describe('PanelTitleExtractor', () => {
  it('returns default title when no names', () => {
    expect(extractPanelTitle({})).toBe('Inspector Panel');
  });

  it('extracts primary name', () => {
    const entity = { names: JSON.stringify({ primary: 'Central Park' }) };
    expect(extractPanelTitle(entity)).toBe('Central Park');
  });

  it('handles invalid JSON gracefully', () => {
    const entity = { names: 'not json' };
    expect(extractPanelTitle(entity)).toBe('Inspector Panel');
  });
});

describe('PropertyOrderer', () => {
  it('filters out @ prefixed keys', () => {
    const entity = { id: '1', '@name': 'test', type: 'place' };
    const keys = createOrderedKeys(entity);
    expect(keys.map(k => k.key)).not.toContain('@name');
    expect(keys.map(k => k.key)).toContain('id');
  });

  it('places subclass indented after class', () => {
    const entity = { id: '1', class: 'road', subclass: 'highway' };
    const keys = createOrderedKeys(entity);
    const classIdx = keys.findIndex(k => k.key === 'class');
    const subclassIdx = keys.findIndex(k => k.key === 'subclass');
    expect(subclassIdx).toBe(classIdx + 1);
    expect(keys[subclassIdx].indented).toBe(true);
  });
});
