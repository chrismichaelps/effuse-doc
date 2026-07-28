/**
 * Heading anchors.
 *
 * Mirrors the character rules of Ink's internal `generateHeadingId`. Ink scopes
 * its duplicate counter to the module and does not export a reset, so ids shift
 * between renders; the counter here is scoped per document instead.
 */

/** Slugs one heading title. */
const toSlug = (text: string): string => {
  const slug = text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

  return slug || 'section';
};

export interface HeadingSlugger {
  /** Returns the id for the next heading with this title, in document order. */
  next: (text: string) => string;
}

/** Duplicate titles are suffixed `id`, `id-1`, `id-2`, matching Ink. */
export const createHeadingSlugger = (): HeadingSlugger => {
  const seen = new Map<string, number>();

  return {
    next: (text: string): string => {
      const slug = toSlug(text);
      const count = seen.get(slug) ?? 0;
      seen.set(slug, count + 1);
      return count === 0 ? slug : `${slug}-${String(count)}`;
    },
  };
};
