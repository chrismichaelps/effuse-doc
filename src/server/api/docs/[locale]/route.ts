import { defineServerFileHandler, defineServerRequest, serverSchema } from '@effuse/core';
import { DEFAULT_LOCALE, listSlugs, LOCALES } from '../../../docs/content.js';

export const request = defineServerRequest({
  params: serverSchema.object({
    locale: serverSchema.literal(...LOCALES),
  }),
});

/** Every slug available for a locale. Backs the content parity diagnostics. */
export const GET = defineServerFileHandler(
  '/api/docs/[locale]',
  request,
  ({ input }) => ({
    locale: input.params.locale,
    defaultLocale: DEFAULT_LOCALE,
    slugs: listSlugs(input.params.locale),
  })
);
