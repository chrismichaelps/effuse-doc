import type { DocEntry } from './markdownParser.js';
import {
  buildIndex,
  searchIndex,
  getDoc,
  type InvertedIndex,
  type SearchMatch,
} from './invertedIndex.js';
import { isSome } from '../../utils/data/index.js';
import type {
  SearchCodePreview,
  SearchResultItem,
} from '../../content/search/types.js';
import {
  SEARCH_MAX_QUERY_LENGTH,
  SEARCH_MAX_RESULTS,
  SEARCH_MIN_QUERY_LENGTH,
  normalizeSearchQuery,
  searchQueryLength,
} from '../../content/search/config.js';

export type { SearchResultItem } from '../../content/search/types.js';

interface SearchEngineConfig {
  maxResults: number;
  snippetLength: number;
  snippetContext: number;
}

const DEFAULT_CONFIG: SearchEngineConfig = {
  maxResults: SEARCH_MAX_RESULTS,
  snippetLength: 150,
  snippetContext: 60,
};

const CODE_PREVIEW_LINES = 7;
const CODE_PREVIEW_LINE_LENGTH = 240;

const findMatchIndex = (text: string, terms: readonly string[]): number => {
  const lower = text.toLowerCase();
  let bestIndex = -1;

  for (const term of terms) {
    const index = lower.indexOf(term.toLowerCase());
    if (index !== -1 && (bestIndex === -1 || index < bestIndex)) {
      bestIndex = index;
    }
  }

  return bestIndex;
};

const createCodePreview = (
  doc: DocEntry,
  matchedTerms: readonly string[]
): { preview: SearchCodePreview; anchor?: string } | undefined => {
  const matchingBlocks = doc.codeBlocks
    .map((block) => ({
      block,
      matchIndex: findMatchIndex(block.code, matchedTerms),
    }))
    .filter(({ matchIndex }) => matchIndex >= 0);
  const selected = matchingBlocks[0];
  if (!selected) return undefined;

  const allLines = selected.block.code.split('\n');
  const matchLine = selected.block.code
    .slice(0, selected.matchIndex)
    .split('\n').length;
  const start = Math.max(
    0,
    Math.min(matchLine - 3, allLines.length - CODE_PREVIEW_LINES)
  );
  const end = Math.min(allLines.length, start + CODE_PREVIEW_LINES);

  return {
    preview: {
      ...(selected.block.language ? { language: selected.block.language } : {}),
      ...(selected.block.headingText
        ? { section: selected.block.headingText }
        : {}),
      lines: allLines
        .slice(start, end)
        .map((line) => line.slice(0, CODE_PREVIEW_LINE_LENGTH)),
      startLine: start + 1,
      truncatedBefore: start > 0,
      truncatedAfter: end < allLines.length,
      additionalMatches: matchingBlocks.length - 1,
    },
    anchor: selected.block.headingId,
  };
};

const createSnippet = (
  text: string,
  matchedTerms: string[],
  config: SearchEngineConfig
): string => {
  if (!text) return '';

  const lower = text.toLowerCase();
  let bestIndex = -1;

  for (const term of matchedTerms) {
    const idx = lower.indexOf(term.toLowerCase());
    if (idx !== -1 && (bestIndex === -1 || idx < bestIndex)) {
      bestIndex = idx;
    }
  }

  if (bestIndex === -1) {
    return (
      text.slice(0, config.snippetLength) +
      (text.length > config.snippetLength ? '...' : '')
    );
  }

  const start = Math.max(0, bestIndex - config.snippetContext);
  const end = Math.min(text.length, bestIndex + config.snippetLength);

  return (
    (start > 0 ? '...' : '') +
    text.slice(start, end) +
    (end < text.length ? '...' : '')
  );
};

const getTextForField = (doc: DocEntry, field: string): string => {
  switch (field) {
    case 'title':
      return doc.title;
    case 'code':
      return doc.codeContent;
    case 'heading':
      return doc.headings.map((h) => h.text).join(' ');
    default:
      return doc.text;
  }
};

const getAnchorForDoc = (
  doc: DocEntry,
  matchedTerms: string[]
): string | undefined => {
  const lower = matchedTerms.map((t) => t.toLowerCase());

  for (const heading of doc.headings) {
    const headingLower = heading.text.toLowerCase();
    if (lower.some((term) => headingLower.includes(term))) {
      return heading.id;
    }
  }

  return doc.headings[0]?.id;
};

const convertMatch = (
  match: SearchMatch,
  doc: DocEntry,
  config: SearchEngineConfig
): SearchResultItem => {
  const fieldText = getTextForField(doc, match.bestField);
  const matchedIn =
    match.bestField === 'heading'
      ? 'heading'
      : match.bestField === 'code'
        ? 'code'
        : match.bestField === 'title'
          ? 'title'
          : 'content';
  const structuredCode =
    matchedIn === 'code'
      ? createCodePreview(doc, match.matchedTerms)
      : undefined;
  const text = structuredCode
    ? structuredCode.preview.lines.join('\n')
    : createSnippet(fieldText, match.matchedTerms, config);

  return {
    id: `${doc.id}-${matchedIn}`,
    documentId: doc.id,
    text,
    score: Math.min(1, match.score / 10),
    heading: doc.title,
    filePath: doc.path,
    anchor: structuredCode?.anchor ?? getAnchorForDoc(doc, match.matchedTerms),
    matchedIn,
    ...(structuredCode ? { code: structuredCode.preview } : {}),
  };
};

export interface SearchEngine {
  index: InvertedIndex;
  search: (query: string) => SearchResultItem[];
  reindex: (docs: readonly DocEntry[]) => void;
}

export const createSearchEngine = (
  initialDocs: readonly DocEntry[] = [],
  customConfig?: Partial<SearchEngineConfig>
): SearchEngine => {
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  let index = buildIndex(initialDocs);

  return {
    get index() {
      return index;
    },

    search(query: string): SearchResultItem[] {
      const normalizedQuery = normalizeSearchQuery(query);
      const length = searchQueryLength(normalizedQuery);
      if (
        length < SEARCH_MIN_QUERY_LENGTH ||
        length > SEARCH_MAX_QUERY_LENGTH
      ) {
        return [];
      }

      const matches = searchIndex(index, normalizedQuery, config.maxResults);

      return matches
        .map((match) => {
          const doc = getDoc(index, match.docId);
          if (!isSome(doc)) return null;
          return convertMatch(match, doc.value, config);
        })
        .filter((r): r is SearchResultItem => r !== null);
    },

    reindex(docs: readonly DocEntry[]): void {
      index = buildIndex(docs);
    },
  };
};

let defaultEngine: SearchEngine | null = null;

export const searchDocs = (
  docs: readonly DocEntry[],
  query: string
): SearchResultItem[] => {
  if (!defaultEngine || defaultEngine.index.docCount !== docs.length) {
    defaultEngine = createSearchEngine(docs);
  }
  return defaultEngine.search(query);
};
