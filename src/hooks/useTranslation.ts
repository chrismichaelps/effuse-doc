import { defineHook, type Signal } from '@effuse/core';
import type { Translations } from '@effuse/i18n';
import { Option, some, none, getOrElse } from '../utils/data/index.js';
import { I18nLayer } from '../layers/I18nLayer.js';

interface I18nProps {
  locale: Signal<string>;
  isLoading: Signal<boolean>;
  translations: Signal<Translations | null>;
}

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

export const useTranslation = defineHook({
  name: 'useTranslation',
  layers: { i18n: I18nLayer } as const,
  setup: ({ layers: { i18n } }): TranslationReturn => {
    const props = i18n.props as unknown as I18nProps;

    const t = (key: string, fallback?: string): string => {
      const translations = props.translations.value;
      if (!translations) return fallback ?? key;
      return getOrElse(
        getNestedValue(translations, key),
        () => fallback ?? key
      );
    };

    return { t, locale: props.locale, isLoading: props.isLoading };
  },
});
