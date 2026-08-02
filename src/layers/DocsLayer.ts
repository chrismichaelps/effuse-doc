import { defineLayer, signal } from '@effuse/core';
import { DocsLayout } from '../components/docs/DocsLayout';
import { DocsHeader } from '../components/docs/DocsHeader';
import { LanguageSelector } from '../components/docs/LanguageSelector';

/**
 * Documentation as a capability.
 *
 * Content resolution lives in `src/server/docs`, reached only through the
 * file-derived endpoints under `src/server/api`. Importing it here would put
 * the markdown glob and the server runtime into the browser bundle.
 */
export const DocsLayer = defineLayer({
  name: 'docs',
  dependencies: ['sidebar', 'i18n'],
  props: {
    currentSlug: signal(''),
  },
  components: {
    DocsLayout,
    DocsHeader,
    LanguageSelector,
  },
});
