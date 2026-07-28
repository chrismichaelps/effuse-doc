import { defineLayer } from '@effuse/core';
import { isServer } from '@effuse/use';
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
  services: {
    i18n: () => i18nStore,
  },
  onMount: (ctx) => {
    // The persisted locale lives in the browser. On the server there is
    // nothing to restore, so the store keeps its declared default and the
    // client applies the saved locale when it hydrates.
    if (isServer()) return;

    const s = ctx.store as typeof i18nStore;
    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (savedLocale && savedLocale !== s.locale.value) {
      s.setLocale(savedLocale as Locale);
    }
  },
  onUnmount: (ctx) => {
    if (isServer()) return;

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
