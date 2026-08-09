import { defineHook, type Signal } from '@effuse/core';
import { getI18n } from '@effuse/i18n';
import { I18nLayer } from '../layers/I18nLayer.js';
import { i18nStore } from '../store/appI18n.js';

const translationLayers = { i18n: I18nLayer } as const;

interface TranslationReturn {
  t: (key: string, fallback?: string) => string;
  locale: Signal<string>;
  isLoading: Signal<boolean>;
}

export const useTranslation = defineHook<
  undefined,
  TranslationReturn,
  typeof translationLayers
>({
  name: 'useTranslation',
  layers: translationLayers,
  setup: (): TranslationReturn => {
    const runtime = getI18n();
    const locale = runtime.locale;
    const isLoading = i18nStore.isLoading;

    const t = (key: string, fallback?: string): string => {
      if (!runtime.hasKey(key)) return fallback ?? key;
      return runtime.t(key);
    };

    return { t, locale, isLoading };
  },
});
