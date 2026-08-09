import { getDocSearchEntry, listSlugs } from '../docs/content.js';
import { isLocale } from '../../content/docs/constants.js';
import type { DocEntry } from './document.types.js';

/** Builds a locale index from the document compiler's cached projections. */
export const loadDocsIndex = async (lang: string): Promise<DocEntry[]> => {
  if (!isLocale(lang)) return [];

  const entries = await Promise.all(
    listSlugs(lang).map((slug) => getDocSearchEntry(lang, slug))
  );
  return entries.filter((entry): entry is DocEntry => entry !== null);
};

export type { DocEntry };
