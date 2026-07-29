export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_MAX_QUERY_LENGTH = 120;
export const SEARCH_MAX_RESULTS = 10;

export const normalizeSearchQuery = (query: string): string =>
  query.trim().replace(/\s+/gu, ' ');

export const searchQueryLength = (query: string): number =>
  Array.from(query).length;
