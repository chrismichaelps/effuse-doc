import { defineServerFileHandler, defineServerRequest } from '@effuse/core';
import { searchLocale } from '../../search/search.js';
import { SearchQuerySchema } from './schema.js';

export const request = defineServerRequest({
  query: SearchQuerySchema,
});

export const GET = defineServerFileHandler(
  '/api/search',
  request,
  async ({ input }) => ({
    results: await searchLocale(input.query.locale, input.query.q),
  })
);
