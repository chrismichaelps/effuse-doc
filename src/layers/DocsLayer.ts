import { defineLayer, signal } from '@effuse/core';

export const DocsLayer = defineLayer({
  name: 'docs',
  dependencies: ['sidebar', 'i18n'],
  props: {
    theme: signal<'light' | 'dark'>('light'),
    currentSlug: signal(''),
  },
  onMount: () => {
    console.log('[DocsLayer] mounted');
  },
  onUnmount: () => {
    console.log('[DocsLayer] unmounted');
  },
  onError: (err) => {
    console.error('[DocsLayer] error:', (err as Error).message);
  },
  setup: () => {
    return () => {
      console.log('[DocsLayer] cleanup');
    };
  },
});
