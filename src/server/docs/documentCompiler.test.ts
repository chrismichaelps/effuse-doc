import { describe, expect, it } from 'vitest';
import { compileDocumentSource } from './documentCompiler.js';

describe('document compiler', () => {
  it('uses identical Unicode-safe anchors for the TOC and search index', () => {
    const compiled = compileDocumentSource(
      [
        '---',
        'title: 国際化',
        '---',
        '# 国際化',
        '',
        '## 使用方法',
        '',
        '本文',
        '',
        '## 使用方法',
      ].join('\n'),
      { slug: 'i18n', locale: 'ja' }
    );

    expect(compiled.toc.map(({ id }) => id)).toEqual([
      '国際化',
      '使用方法',
      '使用方法-1',
    ]);
    expect(compiled.searchEntry.headings.map(({ id }) => id)).toEqual(
      compiled.toc.map(({ id }) => id)
    );
  });

  it('indexes prose and code from the same parsed document', () => {
    const compiled = compileDocumentSource(
      '# API calls\n\nFetch remote data.\n\n```ts\nconst data = await fetch(url);\n```',
      { slug: 'queries', locale: 'en' }
    );

    expect(compiled.searchEntry.text).toContain('Fetch remote data.');
    expect(compiled.searchEntry.codeContent).toContain('await fetch(url)');
    expect(compiled.searchEntry.codeBlocks[0]?.headingId).toBe('api-calls');
  });
});
