import {
  defineServerFileHandler,
  defineServerRequest,
  serverSchema,
} from '@effuse/core';
import { DEFAULT_LOCALE, listSlugs, LOCALES } from '../../../docs/content.js';

export const request = defineServerRequest({
  params: serverSchema.object({
    locale: serverSchema.literal(...LOCALES),
  }),
});

/** Every slug available for a locale. Backs the content parity diagnostics. */
/**
 * Immutable for the lifetime of a deploy. `revalidate` declares that the
 * response *may* be cached, which compiles to Cache-Control and cache tags for
 * a CDN; the origin still runs unless a response cache is also supplied.
 */
export const metadata = {
  cache: { revalidate: 3600, tags: ['docs'] },
};

export const GET = defineServerFileHandler(
  '/api/docs/[locale]',
  request,
  ({ input }) => ({
    locale: input.params.locale,
    defaultLocale: DEFAULT_LOCALE,
    slugs: listSlugs(input.params.locale),
  })
);
