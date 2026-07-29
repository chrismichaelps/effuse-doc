import { isString, isNumber, isRecord } from '../../utils/data/index.js';

export const MAX_INDEX_TOKENS_PER_FIELD = 4096;
export const MAX_QUERY_TOKENS = 16;

const MAX_CODE_IDENTIFIERS = 512;
const WORD_PATTERN = /[\p{L}\p{N}_$'-]+/gu;
const CJK_PATTERN =
  /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

export interface Token {
  term: string;
  position: number;
  type: 'word' | 'code' | 'ngram';
}

export const isValidToken = (value: unknown): value is Token =>
  isRecord(value) &&
  isString(value.term) &&
  isNumber(value.position) &&
  isString(value.type) &&
  ['word', 'code', 'ngram'].includes(value.type);

const normalize = (str: string): string =>
  str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const splitCamelCase = (str: string): string[] => {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .split(/\s+/)
    .filter((s) => s.length > 1);
};

const splitSnakeCase = (str: string): string[] => {
  return str
    .toLowerCase()
    .split(/[_-]+/)
    .filter((s) => s.length > 1);
};

const extractCodeIdentifiers = (text: string): string[] => {
  const identifiers: string[] = [];

  const patterns = [
    /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g,
    /\b(use[A-Z][a-zA-Z0-9]*)\b/g,
    /\b(create[A-Z][a-zA-Z0-9]*)\b/g,
    /\b(define[A-Z][a-zA-Z0-9]*)\b/g,
    /\b([A-Z][a-zA-Z0-9]+)\b/g,
    /['"`]([a-zA-Z][a-zA-Z0-9_-]*)['"`]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const id = match[1];
      if (id && id.length > 1) {
        identifiers.push(id.toLowerCase());
        if (identifiers.length >= MAX_CODE_IDENTIFIERS) break;
      }
    }
    if (identifiers.length >= MAX_CODE_IDENTIFIERS) break;
  }

  return [...new Set(identifiers)];
};

const generateNgrams = (str: string, minLen = 3, maxLen = 8): string[] => {
  const ngrams: string[] = [];
  const characters = Array.from(str.toLowerCase());

  for (let len = minLen; len <= Math.min(maxLen, characters.length); len++) {
    for (let i = 0; i <= characters.length - len; i++) {
      ngrams.push(characters.slice(i, i + len).join(''));
    }
  }

  return ngrams;
};

export const tokenize = (text: string, includeNgrams = false): Token[] => {
  const tokens: Token[] = [];
  const seen = new Set<string>();
  let position = 0;

  const add = (term: string, type: Token['type']): void => {
    const normalized = normalize(term);
    if (
      normalized.length < 2 ||
      seen.has(normalized) ||
      tokens.length >= MAX_INDEX_TOKENS_PER_FIELD
    ) {
      return;
    }
    seen.add(normalized);
    tokens.push({ term: normalized, position: position++, type });
  };

  const words = text.match(WORD_PATTERN) ?? [];

  for (const word of words) {
    add(word, 'word');

    if (/[A-Z]/.test(word)) {
      for (const part of splitCamelCase(word)) {
        add(part, 'word');
      }
    }

    if (word.includes('_') || word.includes('-')) {
      for (const part of splitSnakeCase(word)) {
        add(part, 'word');
      }
    }

    if (CJK_PATTERN.test(word)) {
      for (const ngram of generateNgrams(word, 2, 3)) add(ngram, 'ngram');
    }
  }

  const codeIds = extractCodeIdentifiers(text);
  for (const id of codeIds) {
    add(id, 'code');

    for (const part of splitCamelCase(id)) {
      add(part, 'code');
    }
  }

  if (includeNgrams) {
    for (const identifier of codeIds) {
      for (const ngram of generateNgrams(identifier, 3, 6)) {
        add(ngram, 'ngram');
      }
    }
  }

  return tokens;
};

export const tokenizeQuery = (query: string): string[] => {
  const terms = new Set<string>();
  const add = (term: string): void => {
    const normalized = normalize(term);
    if (normalized.length >= 2 && terms.size < MAX_QUERY_TOKENS) {
      terms.add(normalized);
    }
  };

  const words = query.match(WORD_PATTERN) ?? [];
  for (const word of words) {
    add(word);
    if (CJK_PATTERN.test(word)) {
      for (const ngram of generateNgrams(word, 2, 3)) add(ngram);
    }
  }

  const codeIds = extractCodeIdentifiers(query);
  for (const identifier of codeIds) add(identifier);

  return [...terms];
};
