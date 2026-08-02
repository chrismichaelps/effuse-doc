export const THEME_STORAGE_KEY = 'effuse:theme';

export type Theme = 'light' | 'dark';

export const isTheme = (value: unknown): value is Theme =>
  value === 'light' || value === 'dark';

export const resolveTheme = (
  storedTheme: string | null,
  prefersDark: boolean
): Theme =>
  isTheme(storedTheme) ? storedTheme : prefersDark ? 'dark' : 'light';

export const readStoredTheme = (
  storage: Pick<Storage, 'getItem'> | undefined
): Theme | null => {
  try {
    const value = storage?.getItem(THEME_STORAGE_KEY) ?? null;
    return isTheme(value) ? value : null;
  } catch {
    return null;
  }
};

export const persistTheme = (
  theme: Theme,
  storage: Pick<Storage, 'setItem'> | undefined
): void => {
  try {
    storage?.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Theme selection remains active for this page when storage is blocked.
  }
};

export const applyTheme = (
  theme: Theme,
  root: HTMLElement = document.documentElement
): void => {
  root.dataset.theme = theme;
  root.style.colorScheme = theme;

  const themeColor = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]'
  );
  themeColor?.setAttribute('content', theme === 'dark' ? '#080808' : '#ffffff');
};

export const getDocumentTheme = (
  root: HTMLElement = document.documentElement
): Theme => (root.dataset.theme === 'dark' ? 'dark' : 'light');

export const toggleTheme = (theme: Theme): Theme =>
  theme === 'dark' ? 'light' : 'dark';
