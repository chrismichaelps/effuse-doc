import { describe, expect, it } from 'vitest';
import { isSome } from '../../utils/data/index.js';
import { parseMarkdownContent } from './markdownParser.js';

describe('Markdown search parser', () => {
  it('preserves fenced code language, source line, and nearest section', () => {
    const parsed = parseMarkdownContent(
      '/docs/component.md',
      [
        '# Component API',
        '',
        '## Define a component',
        '',
        '```ts title="example"',
        'const App = define({});',
        '```',
      ].join('\n')
    );

    expect(isSome(parsed)).toBe(true);
    if (!isSome(parsed)) return;

    expect(parsed.value.codeBlocks).toEqual([
      {
        id: 'component-code-1',
        language: 'ts',
        code: 'const App = define({});',
        headingId: 'define-a-component',
        headingText: 'Define a component',
        startLine: 6,
      },
    ]);
  });

  it('caps stored fenced code while retaining a searchable aggregate', () => {
    const oversized = 'x'.repeat(15_000);
    const parsed = parseMarkdownContent(
      '/docs/limits.md',
      `# Limits\n\n\`\`\`js\n${oversized}\n\`\`\``
    );

    expect(isSome(parsed)).toBe(true);
    if (!isSome(parsed)) return;
    expect(parsed.value.codeBlocks[0]?.code).toHaveLength(12_000);
    expect(parsed.value.codeContent.length).toBeLessThanOrEqual(4_000);
  });
});
