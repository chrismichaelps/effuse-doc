import { createDataCache } from '@effuse/core/server';
import { DEFAULT_LOCALE, type Locale } from '../../content/docs/constants.js';
import type { Doc } from '../../domains/docs/contracts/document.schema.js';
import {
  compileDocumentSource,
  type CompiledDocumentSource,
} from './documentCompiler.js';
import type { DocEntry } from '../search/document.types.js';

export {
  DEFAULT_LOCALE,
  DEFAULT_SLUG,
  LOCALES,
  isLocale,
} from '../../content/docs/constants.js';
export type { Locale } from '../../content/docs/constants.js';
export type {
  Doc,
  TocEntry,
} from '../../domains/docs/contracts/document.schema.js';

/** Lazy: one chunk per document, so a request loads only what it serves. */
const documents = import.meta.glob<string>('../../content/docs/*/*.md', {
  query: '?raw',
  import: 'default',
});

const keyOf = (locale: string, slug: string): string =>
  `../../content/docs/${locale}/${slug}.md`;

const load = async (locale: Locale, slug: string): Promise<string | null> => {
  const loader = documents[keyOf(locale, slug)];
  if (!loader) return null;
  return loader();
};

/**
 * Documents are immutable for the lifetime of a deploy, so parsing is memoised
 * rather than repeated per request. Tagged per locale so a content change can
 * drop one language without clearing the rest.
 */
const docCache = createDataCache({ maxEntries: 256 });

const readCompiledDocument = docCache.cached(
  async (
    locale: Locale,
    slug: string
  ): Promise<CompiledDocumentSource | null> => {
    const raw = await load(locale, slug);
    if (raw === null) return null;

    return compileDocumentSource(raw, { slug, locale });
  },
  {
    life: { stale: 3600, expire: 86_400 },
    tags: (locale) => [`docs:${locale}`],
  }
);

/** Resolves one document, or `null` when the locale has no such slug. */
export const getDoc = async (
  locale: Locale,
  slug: string
): Promise<Doc | null> => {
  const compiled = await readCompiledDocument(locale, slug);
  if (!compiled) return null;

  return {
    slug,
    locale,
    title: compiled.title,
    content: compiled.content,
    toc: compiled.toc,
  };
};

/** Returns the search projection of the cached document compilation. */
export const getDocSearchEntry = async (
  locale: Locale,
  slug: string
): Promise<DocEntry | null> =>
  (await readCompiledDocument(locale, slug))?.searchEntry ?? null;

/** Drops memoised documents for a locale, or all of them. */
export const invalidateDocs = (locale?: Locale): void => {
  if (locale) {
    docCache.invalidateTags([`docs:${locale}`]);
    return;
  }
  docCache.clear();
};

/** Resolves a document, falling back to English when untranslated. */
export const getDocWithFallback = async (
  locale: Locale,
  slug: string
): Promise<Doc | null> =>
  (await getDoc(locale, slug)) ??
  (locale === DEFAULT_LOCALE ? null : getDoc(DEFAULT_LOCALE, slug));

/** Every slug present for a locale, sorted. */
export const listSlugs = (locale: Locale): readonly string[] => {
  const prefix = `../../content/docs/${locale}/`;
  return Object.keys(documents)
    .filter((path) => path.startsWith(prefix))
    .map((path) => path.slice(prefix.length).replace(/\.md$/, ''))
    .sort();
};
