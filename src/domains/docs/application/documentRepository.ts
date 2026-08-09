import type { Locale } from '../../../content/docs/constants.js';
import { DocResponseSchema, type Doc } from '../contracts/document.schema.js';

/** Preserves transport status without exposing response parsing to UI code. */
export class DocumentRequestError extends Error {
  readonly status: number;
  readonly slug: string;

  constructor(status: number, slug: string) {
    super(
      status === 404
        ? `Document not found: ${slug}`
        : `Document request failed with status ${status}`
    );
    this.name = 'DocumentRequestError';
    this.status = status;
    this.slug = slug;
  }
}

/** Produces the canonical cache identity for a localized document. */
export const documentQueryKey = (
  locale: Locale,
  slug: string
): readonly ['docs', Locale, string] => ['docs', locale, slug];

/** Fetches and validates one document at the network trust boundary. */
export const requestDocument = async (
  locale: Locale,
  slug: string
): Promise<Doc> => {
  const response = await fetch(
    `/api/docs/${locale}/${encodeURIComponent(slug)}`
  );
  if (!response.ok) throw new DocumentRequestError(response.status, slug);
  return DocResponseSchema.parse(await response.json());
};
