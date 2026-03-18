import { defineLayer } from '@effuse/core';
import { i18nStore, Locale } from '../store/appI18n';

const LOCALE_STORAGE_KEY = 'effuse:locale';

export const I18nLayer = defineLayer({
  name: 'i18n',
  dependencies: ['router'],
  store: i18nStore,
  deriveProps: (store) => {
    const s = store as typeof i18nStore;
    return {
      locale: s.locale,
      isLoading: s.isLoading,
      translations: s.translations,
    };
  },
  provides: {
    i18n: () => i18nStore,
  },
  onMount: (ctx) => {
    const s = ctx.store as typeof i18nStore;
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && savedLocale !== s.locale.value) {
      s.setLocale(savedLocale as Locale);
    }
  },
  onUnmount: (ctx) => {
    const s = ctx.store as typeof i18nStore;
    localStorage.setItem(LOCALE_STORAGE_KEY, s.locale.value);
  },
  onError: (_err, ctx) => {
    const s = ctx.store as typeof i18nStore;
    s.setLocale('en');
  },
  setup: (ctx) => {
    const s = ctx.store as typeof i18nStore;
    s.init();
  },
});
