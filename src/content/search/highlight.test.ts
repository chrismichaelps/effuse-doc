import { describe, expect, it } from 'vitest';
import { splitSearchHighlight } from './highlight.js';

describe('search result highlighting', () => {
  it.each([
    ['define(', 'const Component = define({});'],
    ['signal.value', 'return signal.value;'],
    ['items[0]', 'const first = items[0];'],
    ['use*', 'Search for use* APIs'],
  ])('treats %s as literal text', (query, text) => {
    expect(splitSearchHighlight(text, query)).toContain(query);
  });

  it('matches without changing the result casing', () => {
    expect(splitSearchHighlight('Use define() here', 'DEFINE(')).toEqual([
      'Use ',
      'define(',
      ') here',
    ]);
  });
});
