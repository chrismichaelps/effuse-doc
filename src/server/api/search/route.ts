import {
  defineServerFileHandler,
  defineServerRequest,
  serverSchema,
} from '@effuse/core';
import { LOCALES } from '../../docs/content.js';
import { searchLocale } from '../../search/search.js';

export const request = defineServerRequest({
  query: serverSchema.object({
    locale: serverSchema.literal(...LOCALES),
    q: serverSchema.string,
  }),
});

export const GET = defineServerFileHandler(
  '/api/search',
  request,
  async ({ input }) => ({
    results: await searchLocale(input.query.locale, input.query.q),
  })
);
