/** Shared by the client and the server; free of any markdown imports. */

export const LOCALES = ['en', 'es', 'ja', 'zh'] as const;

export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'en';

export const DEFAULT_SLUG = 'getting-started';

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);
