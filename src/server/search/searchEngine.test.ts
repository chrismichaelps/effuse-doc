import { describe, expect, it } from 'vitest';
import { SEARCH_MAX_RESULTS } from '../../content/search/config.js';
import type { DocEntry } from './markdownParser.js';
import { createSearchEngine } from './searchEngine.js';
import {
  MAX_INDEX_TOKENS_PER_FIELD,
  MAX_QUERY_TOKENS,
  tokenize,
  tokenizeQuery,
} from './tokenizer.js';

const doc = (
  id: string,
  title: string,
  text = '',
  heading?: string,
  codeContent = ''
): DocEntry => ({
  id,
  title,
  text,
  codeContent,
  path: `en/${id}.md`,
  headings: heading ? [{ text: heading, id: 'section', level: 2 }] : [],
});

describe('production search engine', () => {
  const engine = createSearchEngine([
    doc('title', 'Signals'),
    doc('heading', 'Reactivity', '', 'Signals and state'),
    doc('body', 'Introduction', 'Signals power reactive applications.'),
  ]);

  it('ranks title and heading matches ahead of body matches', () => {
    expect(engine.search('signals').map((result) => result.documentId)).toEqual(
      ['title', 'heading', 'body']
    );
  });

  it('resolves prefixes and a common typo to the intended title', () => {
    expect(engine.search('sign')[0]?.documentId).toBe('title');
    expect(engine.search('signlas')[0]?.documentId).toBe('title');
  });

  it.each(['define(', 'signal.value', 'items[0]', '=>', 'use*'])(
    'ranks and displays the literal code fragment %s',
    (query) => {
      const code = [
        'const Component = define({});',
        'const current = signal.value;',
        'const first = items[0];',
        'const identity = (value) => value;',
        '// Explore use* APIs.',
      ].join('\n');
      const codeEngine = createSearchEngine([
        doc('prose', 'API reference', '', 'define and signal'),
        doc('example', 'Complete example', '', undefined, code),
      ]);

      const result = codeEngine.search(query)[0];
      expect(result?.documentId).toBe('example');
      expect(result?.matchedIn).toBe('code');
      expect(result?.text.toLowerCase()).toContain(query.toLowerCase());
    }
  );

  it('indexes Japanese and Chinese search terms', () => {
    const translated = createSearchEngine([
      doc('ja-search', '検索ガイド', 'ドキュメントを検索します。'),
      doc('zh-router', '路由指南', '配置应用程序路由。'),
    ]);

    expect(translated.search('検索')[0]?.documentId).toBe('ja-search');
    expect(translated.search('路由')[0]?.documentId).toBe('zh-router');
  });

  it('caps index tokens, query expansion, and result count', () => {
    const uniqueWords = Array.from(
      { length: MAX_INDEX_TOKENS_PER_FIELD * 2 },
      (_, index) => `word${index}`
    ).join(' ');
    expect(tokenize(uniqueWords)).toHaveLength(MAX_INDEX_TOKENS_PER_FIELD);
    expect(tokenizeQuery(uniqueWords)).toHaveLength(MAX_QUERY_TOKENS);

    const manyDocs = Array.from({ length: 25 }, (_, index) =>
      doc(`common-${index}`, `Common ${index}`)
    );
    expect(createSearchEngine(manyDocs).search('common')).toHaveLength(
      SEARCH_MAX_RESULTS
    );
  });
});
