import { createDataCache } from '@effuse/core/server';
import { parseSync } from '@effuse/ink';
import type { BlockNode, DocumentNode, InlineNode } from '@effuse/ink';
import { createHeadingSlugger } from './slug.js';
import { DEFAULT_LOCALE, type Locale } from '../../content/docs/constants.js';
import type { Doc, TocEntry } from '../../content/docs/types.js';

export {
  DEFAULT_LOCALE,
  DEFAULT_SLUG,
  LOCALES,
  isLocale,
} from '../../content/docs/constants.js';
export type { Locale } from '../../content/docs/constants.js';
export type { Doc, TocEntry } from '../../content/docs/types.js';

/** Lazy: one chunk per document, so a request loads only what it serves. */
const documents = import.meta.glob('../../content/docs/*/*.md', {
  query: '?raw',
  import: 'default',
}) as Record<string, () => Promise<string>>;

const keyOf = (locale: string, slug: string): string =>
  `../../content/docs/${locale}/${slug}.md`;

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const TITLE_FIELD = /^title:\s*(.+)$/m;

type Parsed = {
  readonly frontmatter: string | null;
  readonly body: string;
};

const splitFrontmatter = (markdown: string): Parsed => {
  const match = FRONTMATTER.exec(markdown);
  if (!match) return { frontmatter: null, body: markdown };
  return { frontmatter: match[1], body: markdown.slice(match[0].length) };
};

/** Flattens a heading's inline nodes to its rendered text. */
const headingText = (children: readonly InlineNode[]): string =>
  children
    .map((child) => {
      if (child._tag === 'Text' || child._tag === 'InlineCode') {
        return child.value;
      }
      if ('children' in child) {
        return headingText(child.children as readonly InlineNode[]);
      }
      return '';
    })
    .join('');

/** Builds the table of contents from the document AST. */
const buildToc = (ast: DocumentNode): readonly TocEntry[] => {
  const slugger = createHeadingSlugger();
  const entries: TocEntry[] = [];

  for (const node of ast.children as readonly BlockNode[]) {
    if (node._tag !== 'Heading') continue;
    const title = headingText(node.children).trim();
    // Every heading consumes a slug, including levels the TOC omits, to stay
    // aligned with the ids assigned during rendering.
    const id = slugger.next(title);
    if (node.level > 3) continue;
    entries.push({ id, title, level: node.level });
  }

  return entries;
};

/** Frontmatter `title`, else the first H1, else a humanised slug. */
const resolveTitle = (parsed: Parsed, slug: string): string => {
  if (parsed.frontmatter) {
    const field = TITLE_FIELD.exec(parsed.frontmatter);
    if (field) return field[1].trim();
  }

  const h1 = /^#\s+(.+)$/m.exec(parsed.body);
  if (h1) return h1[1].trim();

  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

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

const readDoc = docCache.cached(
  async (locale: Locale, slug: string): Promise<Doc | null> => {
    const raw = await load(locale, slug);
    if (raw === null) return null;

    const parsed = splitFrontmatter(raw);
    const content = parsed.body.trim();

    return {
      slug,
      locale,
      title: resolveTitle(parsed, slug),
      content,
      toc: buildToc(parseSync(content)),
    };
  },
  {
    life: { stale: 3600, expire: 86_400 },
    tags: (locale) => [`docs:${locale}`],
  }
);

/** Resolves one document, or `null` when the locale has no such slug. */
export const getDoc = (
  locale: Locale,
  slug: string
): Promise<Doc | null> => readDoc(locale, slug);

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
