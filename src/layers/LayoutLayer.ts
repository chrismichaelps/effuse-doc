import { defineLayer, signal, type Signal } from '@effuse/core';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const LayoutLayer = defineLayer({
  name: 'layout',
  props: {
    isDarkMode: signal(false),
    isMobileMenuOpen: signal(false),
  },
  components: {
    Header,
    Footer,
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
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    s.props.isDarkMode.value = mediaQuery.matches;

    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      s.props.isDarkMode.value = e.matches;
    };

    mediaQuery.addEventListener('change', handleDarkModeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleDarkModeChange);
    };
  },
});
