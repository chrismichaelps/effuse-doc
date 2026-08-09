import { z } from 'zod';
import { LOCALES } from '../../../content/docs/constants.js';
import {
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MIN_QUERY_LENGTH,
  normalizeSearchQuery,
  searchQueryLength,
} from '../../../content/search/config.js';

const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/u;

export const SearchTermSchema = z
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

/** Normalizes and validates query parameters before search index access. */
export const SearchQuerySchema = z.strictObject({
  locale: z.enum(LOCALES),
  q: SearchTermSchema,
});

export const SearchCodePreviewSchema = z.strictObject({
  language: z.string().optional(),
  section: z.string().optional(),
  lines: z.array(z.string()).readonly(),
  startLine: z.number().int().nonnegative(),
  truncatedBefore: z.boolean(),
  truncatedAfter: z.boolean(),
  additionalMatches: z.number().int().nonnegative(),
});

export const SearchResultSchema = z.strictObject({
  id: z.string(),
  documentId: z.string(),
  text: z.string(),
  score: z.number(),
  heading: z.string().optional(),
  filePath: z.string().optional(),
  anchor: z.string().optional(),
  matchedIn: z.enum(['title', 'content', 'code', 'heading']).optional(),
  code: SearchCodePreviewSchema.optional(),
});

/** Validates the serialized search response consumed by the client store. */
export const SearchResponseSchema = z.strictObject({
  results: z.array(SearchResultSchema).readonly(),
});

export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchCodePreview = z.infer<typeof SearchCodePreviewSchema>;
export type SearchResultItem = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
