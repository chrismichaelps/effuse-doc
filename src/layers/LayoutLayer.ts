import { defineLayer, signal, type Signal } from '@effuse/core';
import { applyTheme, readStoredTheme, resolveTheme } from '../theme.js';

export const LayoutLayer = defineLayer({
  name: 'layout',
  props: {
    isDarkMode: signal(false),
    isMobileMenuOpen: signal(false),
  },
  onMount: () => {
    console.log('[LayoutLayer] mounted');
  },
  onUnmount: () => {
    console.log('[LayoutLayer] unmounted');
  },
  onError: (err) => {
    console.error('[LayoutLayer] error:', (err as Error).message);
  },
  setup: (ctx) => {
    const s = ctx as unknown as {
      props: { isDarkMode: Signal<boolean>; isMobileMenuOpen: Signal<boolean> };
    };

    // Layer setup runs on the server too, where there is no colour-scheme
    // preference to read. The server renders the declared default and the
    // client picks up the real preference when it hydrates.
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const storedTheme = readStoredTheme(window.localStorage);
    const initialTheme = resolveTheme(storedTheme, mediaQuery.matches);
    s.props.isDarkMode.value = initialTheme === 'dark';
    applyTheme(initialTheme);

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      if (readStoredTheme(window.localStorage)) return;
      s.props.isDarkMode.value = e.matches;
      applyTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleDarkModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDarkModeChange);
    };
  },
});
