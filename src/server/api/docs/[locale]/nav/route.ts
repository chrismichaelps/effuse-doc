import { defineServerFileHandler, defineServerRequest, serverSchema } from '@effuse/core';
import { NAV_SECTIONS } from '../../../../../content/docs/nav.js';
import { LOCALES } from '../../../../docs/content.js';

/**
 * Locale is validated as a closed set, so an unknown locale is rejected by the
 * framework with EFFUSE_VALIDATION_FAILED before the handler runs.
 */
export const request = defineServerRequest({
  params: serverSchema.object({
    locale: serverSchema.literal(...LOCALES),
  }),
});

/**
 * The navigation index.
 *
 * Serves translation *keys* rather than translated labels: the client already
 * holds every translation bundle, so switching language stays instant and never
 * costs a second request.
 */
export const GET = defineServerFileHandler(
  '/api/docs/[locale]/nav',
  request,
  ({ input }) => ({
    locale: input.params.locale,
    sections: NAV_SECTIONS,
  })
);
