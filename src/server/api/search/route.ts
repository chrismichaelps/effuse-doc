import { defineServerFileHandler, defineServerRequest } from '@effuse/core';
import { searchLocale } from '../../search/search.js';
import {
  SearchQuerySchema,
  SearchResponseSchema,
} from '../../contracts/search.js';

export const request = defineServerRequest({
  query: SearchQuerySchema,
});

export const response = SearchResponseSchema;

export const metadata = {
  cache: { revalidate: 300, tags: ['search', 'docs'] },
};

export const GET = defineServerFileHandler(
  '/api/search',
  { request, response },
  async ({ input }) => ({
    results: await searchLocale(input.query.locale, input.query.q),
  })
);
