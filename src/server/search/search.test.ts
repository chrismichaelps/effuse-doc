import { describe, expect, it } from 'vitest';
import { searchLocale } from './search.js';

describe('search result cache', () => {
  it('shares normalized identical query results across concurrent callers', async () => {
    const [first, second, third] = await Promise.all([
      searchLocale('en', '  signals  '),
      searchLocale('en', 'signals'),
      searchLocale('en', ' signals '),
    ]);

    expect(first).toBe(second);
    expect(second).toBe(third);
    expect(Object.isFrozen(first)).toBe(true);
  });
});
