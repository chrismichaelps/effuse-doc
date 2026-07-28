import type { Locale } from './constants.js';

export type TocEntry = {
  readonly id: string;
  readonly title: string;
  readonly level: number;
};

/** The response shape of `GET /api/docs/[locale]/[slug]`. */
export type Doc = {
  readonly slug: string;
  readonly locale: Locale;
  readonly title: string;
  readonly content: string;
  readonly toc: readonly TocEntry[];
};
