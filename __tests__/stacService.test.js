/**
 * Tests for lib/stacService.js
 *
 * jest.resetModules() before each test flushes the module-level in-memory
 * cache (cachedStacData / stacDataPromise) so tests don't bleed into each other.
 *
 * stac-js is mocked as an identity function — fixture objects with the right
 * shape (getChildLinks, id, links) drive all behavior without real STAC parsing.
 */

jest.mock('stac-js', () => ({ __esModule: true, default: (data) => data }));

const CACHE_KEY = 'overture-stac-cache';
const ROOT_URL = 'https://stac.overturemaps.org/catalog.json';
const RELEASE_URL = 'https://stac.overturemaps.org/releases/2024-09-18/catalog.json';
const PMTILES_URL = 'https://example.com/2024-09-18/base.pmtiles';

// Fixtures — absolute pmtiles href so resolveUrl() is a no-op
const ROOT_CATALOG = { getChildLinks: () => [{ href: 'releases/2024-09-18/catalog.json', latest: true }] };
const RELEASE_CATALOG = { id: '2024-09-18', getChildLinks: () => [{ href: 'base/catalog.json', title: 'Base' }] };
const THEME_CATALOG = { id: 'base', links: [{ rel: 'pmtiles', href: PMTILES_URL }] };

function mockFetchSuccess() {
  global.fetch = jest.fn((url) => {
    const data = url === ROOT_URL ? ROOT_CATALOG : url === RELEASE_URL ? RELEASE_CATALOG : THEME_CATALOG;
    return Promise.resolve({ ok: true, json: () => Promise.resolve(data) });
  });
}

describe('stacService', () => {
  let loadPmtilesFromStac;

  beforeEach(() => {
    jest.resetModules();
    localStorage.clear();
    mockFetchSuccess();
    ({ loadPmtilesFromStac } = require('@/lib/stacService'));
  });

  afterEach(() => jest.restoreAllMocks());

  it('cache miss: fetches all 3 catalogs and writes localStorage', async () => {
    const urls = await loadPmtilesFromStac();
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(urls.get('base')).toBe(PMTILES_URL);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY))).toMatchObject({
      releaseUrl: RELEASE_URL,
      releaseId: '2024-09-18',
      pmtilesUrls: { base: PMTILES_URL },
    });
  });

  it('cache hit: fetches only the root catalog and returns cached URLs', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      releaseUrl: RELEASE_URL, releaseId: '2024-09-18', pmtilesUrls: { base: PMTILES_URL },
    }));
    const urls = await loadPmtilesFromStac();
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(urls.get('base')).toBe(PMTILES_URL);
  });

  it('stale cache: falls through to full waterfall when release URL has changed', async () => {
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      releaseUrl: 'https://stac.overturemaps.org/releases/2024-01-01/catalog.json',
      releaseId: '2024-01-01',
      pmtilesUrls: { base: 'https://example.com/old.pmtiles' },
    }));
    const urls = await loadPmtilesFromStac();
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(urls.get('base')).toBe(PMTILES_URL);
  });

  it('localStorage unavailable: completes full waterfall without throwing', async () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('SecurityError'); });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('SecurityError'); });
    const urls = await loadPmtilesFromStac();
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(urls.get('base')).toBe(PMTILES_URL);
  });

  it('corrupt localStorage JSON: falls through to full waterfall and overwrites bad entry', async () => {
    localStorage.setItem(CACHE_KEY, 'not valid json {{{{');
    await loadPmtilesFromStac();
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(JSON.parse(localStorage.getItem(CACHE_KEY)).releaseId).toBe('2024-09-18');
  });

  it.each([
    { label: 'null',    pmtilesUrls: null },
    { label: 'missing', pmtilesUrls: undefined },
    { label: 'array',   pmtilesUrls: [] },
    { label: 'string',  pmtilesUrls: 'bad' },
  ])('wrong-shape cache (pmtilesUrls is $label): evicts key and falls through to full waterfall', async ({ pmtilesUrls }) => {
    const entry = { releaseUrl: RELEASE_URL, releaseId: '2024-09-18' };
    if (pmtilesUrls !== undefined) entry.pmtilesUrls = pmtilesUrls;
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry));
    const removeSpy = jest.spyOn(Storage.prototype, 'removeItem');

    const urls = await loadPmtilesFromStac();

    expect(removeSpy).toHaveBeenCalledWith(CACHE_KEY);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(urls.get('base')).toBe(PMTILES_URL);
  });

  it('in-memory session cache: second call within same session does not re-fetch', async () => {
    await loadPmtilesFromStac();
    await loadPmtilesFromStac();
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('failed promise is cleared so the next call retries successfully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));
    await expect(loadPmtilesFromStac()).rejects.toThrow('network error');
    mockFetchSuccess();
    const urls = await loadPmtilesFromStac();
    expect(urls).toBeInstanceOf(Map);
  });
});
