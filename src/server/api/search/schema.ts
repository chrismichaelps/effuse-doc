import { z } from 'zod';
import { LOCALES } from '../../../content/docs/constants.js';
import {
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MIN_QUERY_LENGTH,
  normalizeSearchQuery,
  searchQueryLength,
} from '../../../content/search/config.js';

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;

const SearchTermSchema = z
  .string()
  .refine((value) => !CONTROL_CHARACTERS.test(value), {
    message: 'Query cannot contain control characters',
  })
  .transform(normalizeSearchQuery)
  .refine((value) => searchQueryLength(value) >= SEARCH_MIN_QUERY_LENGTH, {
    message: `Query must contain at least ${SEARCH_MIN_QUERY_LENGTH} characters`,
  })
  .refine((value) => searchQueryLength(value) <= SEARCH_MAX_QUERY_LENGTH, {
    message: `Query must contain at most ${SEARCH_MAX_QUERY_LENGTH} characters`,
  });

export const SearchQuerySchema = z.strictObject({
  locale: z.enum(LOCALES),
  q: SearchTermSchema,
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
