import { describe, expect, it } from 'vitest';
import { signal } from '@effuse/core';
import { resolveActiveTocId, useScrollSpy } from './useScrollSpy.js';

const toc = [
  { id: 'intro', title: 'Introduction' },
  { id: 'setup', title: 'Setup' },
  { id: 'api', title: 'API' },
];

describe('documentation scroll spy', () => {
  it('synchronizes TOC items that become available after setup', () => {
    const source = signal<typeof toc>([]);
    const spy = useScrollSpy({
      containerSelector: '.docs-main',
      threshold: 150,
      items: source,
    });

    expect(spy.items.value).toEqual([]);

    source.value = toc;
    expect(spy.items.value).toEqual(toc);
    expect(spy.activeId.value).toBe('intro');

    source.value = [{ id: 'next', title: 'Next document' }];
    expect(spy.activeId.value).toBe('next');
  });

  it('selects the latest heading above the activation threshold', () => {
    const tops = new Map([
      ['intro', -400],
      ['setup', 40],
      ['api', 600],
    ]);

    expect(resolveActiveTocId(toc, (item) => tops.get(item.id), 150)).toBe(
      'setup'
    );
  });

  it('falls back safely and selects the final item at scroll end', () => {
    expect(resolveActiveTocId(toc, () => undefined, 150)).toBe('intro');
    expect(resolveActiveTocId(toc, () => undefined, 150, true)).toBe('api');
    expect(resolveActiveTocId([], () => 0, 150, true)).toBe('');
  });
});
