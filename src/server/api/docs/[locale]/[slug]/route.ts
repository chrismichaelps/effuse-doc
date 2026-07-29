import {
  defineServerFileHandler,
  defineServerRequest,
  serverSchema,
} from '@effuse/core';
import { getDocWithFallback, LOCALES } from '../../../../docs/content.js';

export const request = defineServerRequest({
  params: serverSchema.object({
    locale: serverSchema.literal(...LOCALES),
    slug: serverSchema.string,
  }),
});

/**
 * One document: title, markdown body, and the table of contents derived from
 * the same parse that renders it.
 *
 * Falls back to English when a translation is missing, so a reader asking for a
 * page that only exists in English reads it rather than meeting a 404.
 */
/**
 * Immutable for the lifetime of a deploy. `revalidate` declares that the
 * response *may* be cached, which compiles to Cache-Control and cache tags for
 * a CDN; the origin still runs unless a response cache is also supplied.
 */
export const metadata = {
  cache: { revalidate: 3600, tags: ['docs'] },
};

export const GET = defineServerFileHandler(
  '/api/docs/[locale]/[slug]',
  request,
  async ({ input, response }) => {
    const doc = await getDocWithFallback(
      input.params.locale,
      input.params.slug
    );

    return (
      doc ??
      response.error('DOC_NOT_FOUND', 'Document not found.', {
        status: 404,
        details: { locale: input.params.locale, slug: input.params.slug },
      })
    );
  }
);
