import { defineLayer, signal } from '@effuse/core';
import { DocsLayout } from '../components/docs/DocsLayout';
import { DocsHeader } from '../components/docs/DocsHeader';
import { LanguageSelector } from '../components/docs/LanguageSelector';
import { NAV_SECTIONS } from '../content/docs/nav';
import { getDocWithFallback, listSlugs } from '../server/docs/content';

/**
 * Documentation as a capability.
 *
 * The layer owns content resolution and exposes it as a service. The HTTP
 * endpoints that serve it are file-derived under `src/server/api` and adapted
 * by `AppServerLayer`, so a route's URL is its file path.
 */
export const DocsLayer = defineLayer({
  name: 'docs',
  dependencies: ['sidebar', 'i18n'],
  props: {
    theme: signal<'light' | 'dark'>('light'),
    currentSlug: signal(''),
  },
  components: {
    DocsLayout,
    DocsHeader,
    LanguageSelector,
  },
  services: {
    docs: () => ({
      getDoc: getDocWithFallback,
      listSlugs,
      sections: () => NAV_SECTIONS,
    }),
  },
});
