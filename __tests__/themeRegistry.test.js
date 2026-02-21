import { getThemeConfig, isKnownTheme } from '@/components/inspector_panel/config/ThemeRegistry';

describe('ThemeRegistry', () => {
  it('recognizes all 6 themes', () => {
    const themes = ['base', 'buildings', 'divisions', 'places', 'transportation', 'addresses'];
    themes.forEach((theme) => {
      expect(isKnownTheme(theme)).toBe(true);
    });
  });

  it('returns null for unknown themes', () => {
    expect(getThemeConfig('nonexistent')).toBeNull();
  });

  it('returns component and tips for known theme', () => {
    const config = getThemeConfig('buildings');
    expect(config).toHaveProperty('component');
    expect(config).toHaveProperty('tips');
  });
});
