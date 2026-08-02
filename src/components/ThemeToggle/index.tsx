import { define, type Signal } from '@effuse/core';
import { LayoutLayer } from '../../layers/LayoutLayer.js';
import {
  applyTheme,
  getDocumentTheme,
  persistTheme,
  toggleTheme,
} from '../../theme.js';
import './styles.css';

interface ThemeToggleExposed {
  isDarkMode: Signal<boolean>;
  handleToggle: () => void;
}

export const ThemeToggle = define({
  layers: { layout: LayoutLayer } as const,
  script: ({ onMount, layers: { layout } }) => {
    const isDarkMode = layout.props.isDarkMode as Signal<boolean>;

    onMount(() => {
      isDarkMode.value = getDocumentTheme() === 'dark';
    });

    const handleToggle = () => {
      const nextTheme = toggleTheme(isDarkMode.value ? 'dark' : 'light');
      isDarkMode.value = nextTheme === 'dark';
      applyTheme(nextTheme);
      persistTheme(nextTheme, window.localStorage);
    };

    return { isDarkMode, handleToggle } satisfies ThemeToggleExposed;
  },
  template: ({ isDarkMode, handleToggle }) => (
    <button
      type="button"
      class="theme-toggle"
      onClick={handleToggle}
      aria-label={
        isDarkMode.value ? 'Switch to light theme' : 'Switch to dark theme'
      }
      title={
        isDarkMode.value ? 'Switch to light theme' : 'Switch to dark theme'
      }
    >
      <span class="theme-toggle-track" aria-hidden="true">
        <span class="theme-toggle-thumb">
          {isDarkMode.value ? (
            <svg viewBox="0 0 24 24" width="12" height="12">
              <path
                d="M20.4 14.7A8.5 8.5 0 0 1 9.3 3.6 8.5 8.5 0 1 0 20.4 14.7Z"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="12" height="12">
              <circle
                cx="12"
                cy="12"
                r="3.5"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
              />
              <path
                d="M12 2.5v2M12 19.5v2M4.5 12h-2M21.5 12h-2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
              />
            </svg>
          )}
        </span>
      </span>
    </button>
  ),
});
