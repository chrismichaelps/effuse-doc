import { createDataCache } from '@effuse/core/server';
import { LOCALES, type Locale } from '../../content/docs/constants.js';
import type { SearchResultItem } from '../../content/search/types.js';
import { loadDocsIndex } from './docsIndexer.js';
import { createSearchEngine, type SearchEngine } from './searchEngine.js';

const searchIndexCache = createDataCache({ maxEntries: LOCALES.length });

/** Builds each locale's immutable index once and coalesces concurrent builds. */
const getSearchEngine = searchIndexCache.cached(
  async (locale: Locale): Promise<SearchEngine> =>
    createSearchEngine(await loadDocsIndex(locale)),
  {
    life: { stale: 3600, expire: 86_400 },
    tags: (locale) => [`search:${locale}`, `docs:${locale}`],
  }
);

export const searchLocale = async (
  locale: Locale,
  query: string
): Promise<readonly SearchResultItem[]> =>
  (await getSearchEngine(locale)).search(query);

export const invalidateSearch = (locale: Locale): void => {
  searchIndexCache.invalidateTags([`search:${locale}`]);
};
