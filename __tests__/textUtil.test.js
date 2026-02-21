import { format } from '@/lib/util/TextUtil';

describe('TextUtil', () => {
  describe('format', () => {
    it('converts snake_case to Title Case', () => {
      expect(format('building_class')).toBe('Building Class');
    });

    it('handles single word', () => {
      expect(format('land')).toBe('Land');
    });

    it('handles multiple underscores', () => {
      expect(format('land_use_type')).toBe('Land Use Type');
    });
  });
});
