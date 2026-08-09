import { defineLayer, signal } from '@effuse/core';
import { applyTheme, readStoredTheme, resolveTheme } from '../theme.js';
import { getErrorMessage } from '../utils/errors.js';

export const LayoutLayer = defineLayer({
  name: 'layout',
  props: {
    isDarkMode: signal(true),
    isMobileMenuOpen: signal(false),
  },
  onMount: () => {
    console.log('[LayoutLayer] mounted');
  },
  onUnmount: () => {
    console.log('[LayoutLayer] unmounted');
  },
  onError: (err) => {
    console.error('[LayoutLayer] error:', getErrorMessage(err));
  },
  setup: (ctx) => {
    // The server renders the dark default. Hydration only overrides it when
    // the visitor has explicitly saved a theme preference.
    if (typeof window === 'undefined') return undefined;

    const storedTheme = readStoredTheme(window.localStorage);
    const initialTheme = resolveTheme(storedTheme);
    ctx.props.isDarkMode.value = initialTheme === 'dark';
    applyTheme(initialTheme);

    return undefined;
  },
});
