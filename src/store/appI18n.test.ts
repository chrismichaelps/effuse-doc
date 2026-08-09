import { afterEach, describe, expect, it } from 'vitest';
import { i18nStore, type Locale } from './appI18n.js';

const languageKeys = [
  'language.english',
  'language.japanese',
  'language.mandarin',
  'language.spanish',
] as const;

describe('application i18n', () => {
  afterEach(async () => {
    await i18nStore.setLocale('en');
  });

  it.each<readonly [Locale, readonly string[]]>([
    ['en', ['English', '日本語', '简体中文', 'Español']],
    ['es', ['English', '日本語', '简体中文', 'Español']],
    ['ja', ['English', '日本語', '中国語', 'Español']],
    ['zh', ['英语', '日语', '简体中文', '西班牙语']],
  ])('renders every language label for %s', async (locale, expected) => {
    await i18nStore.setLocale(locale);

    expect(languageKeys.map((key) => i18nStore.t(key))).toEqual(expected);
    expect(i18nStore.translations.value?.language.english).toBe(expected[0]);
  });
});
