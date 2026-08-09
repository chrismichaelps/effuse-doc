import { defineLayer } from '@effuse/core';
import { isServer } from '@effuse/use';
import { i18nStore, isLocale } from '../store/appI18n';

const LOCALE_STORAGE_KEY = 'effuse:locale';

export const I18nLayer = defineLayer({
  name: 'i18n',
  dependencies: ['router'],
  store: i18nStore,
  deriveProps: () => ({
    locale: i18nStore.locale,
    isLoading: i18nStore.isLoading,
    translations: i18nStore.translations,
  }),
  services: {
    i18n: () => i18nStore,
  },
  onMount: () => {
    // The persisted locale lives in the browser. On the server there is
    // nothing to restore, so the store keeps its declared default and the
    // client applies the saved locale when it hydrates.
    if (isServer()) return;

    const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (
      savedLocale &&
      isLocale(savedLocale) &&
      savedLocale !== i18nStore.locale.value
    ) {
      void i18nStore.setLocale(savedLocale);
    }
  },
  onUnmount: () => {
    if (isServer()) return;

    localStorage.setItem(LOCALE_STORAGE_KEY, i18nStore.locale.value);
  },
  onError: () => {
    void i18nStore.setLocale('en');
  },
  setup: () => {
    i18nStore.init();
  },
});
