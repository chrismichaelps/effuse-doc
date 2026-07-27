import { defineHook, type Signal } from '@effuse/core';
import type { Translations } from '@effuse/i18n';
import { I18nLayer } from '../layers/I18nLayer.js';
import { Option, some, none, getOrElse } from '../utils/data/index.js';

const translationLayers = { i18n: I18nLayer } as const;

interface TranslationReturn {
  t: (key: string, fallback?: string) => string;
  locale: Signal<string>;
  isLoading: Signal<boolean>;
}

const getNestedValue = (obj: Translations, path: string): Option<string> => {
  const result = path
    .split('.')
    .reduce<unknown>(
      (acc, key) =>
        acc && typeof acc === 'object' ? (acc as Translations)[key] : undefined,
      obj
    );
  return typeof result === 'string' ? some(result) : none();
};

export const useTranslation = defineHook<
  undefined,
  TranslationReturn,
  typeof translationLayers
>({
  name: 'useTranslation',
  layers: translationLayers,
  setup: ({ layers: { i18n } }): TranslationReturn => {
    const locale = i18n.prop('locale') as Signal<string>;
    const isLoading = i18n.prop('isLoading') as Signal<boolean>;
    const translations = i18n.prop('translations') as Signal<Translations | null>;

    const t = (key: string, fallback?: string): string => {
      const value = translations.value;
      if (!value) return fallback ?? key;
      return getOrElse(getNestedValue(value, key), () => fallback ?? key);
    };

    return { t, locale, isLoading };
  },
});
