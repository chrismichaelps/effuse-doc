import { createDataCache } from '@effuse/core/server';
import { LOCALES, type Locale } from '../../content/docs/constants.js';
import type { SearchResultItem } from '../../content/search/types.js';
import { normalizeSearchQuery } from '../../content/search/config.js';
import { loadDocsIndex } from './docsIndexer.js';
import { createSearchEngine, type SearchEngine } from './searchEngine.js';

const searchIndexCache = createDataCache({ maxEntries: LOCALES.length });
const searchResultCache = createDataCache({ maxEntries: 512 });

/** Builds each locale's immutable index once and coalesces concurrent builds. */
const getSearchEngine = searchIndexCache.cached(
  async (locale: Locale): Promise<SearchEngine> =>
    createSearchEngine(await loadDocsIndex(locale)),
  {
    life: { stale: 3600, expire: 86_400 },
    tags: (locale) => [`search:${locale}`, `docs:${locale}`],
  }
);

/** Coalesces popular identical queries and bounds per-instance memory usage. */
const getSearchResults = searchResultCache.cached(
  async (locale: Locale, query: string): Promise<readonly SearchResultItem[]> =>
    (await getSearchEngine(locale)).search(query),
  {
    life: { stale: 300, expire: 3600 },
    key: (locale, query) => `${locale}:${query}`,
    tags: (locale) => [`search:${locale}`, `docs:${locale}`],
  }
);

export const searchLocale = async (
  locale: Locale,
  query: string
): Promise<readonly SearchResultItem[]> =>
  getSearchResults(locale, normalizeSearchQuery(query));

export const invalidateSearch = (locale: Locale): void => {
  searchIndexCache.invalidateTags([`search:${locale}`]);
  searchResultCache.invalidateTags([`search:${locale}`]);
};
