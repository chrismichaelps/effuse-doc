import { describe, expect, it } from 'vitest';
import { discoverServerRegistry } from '@effuse/cli';

describe('file-derived server registry', () => {
  it('exposes only route modules as server endpoints', () => {
    const registry = discoverServerRegistry(process.cwd());

    const apiPaths = registry.entries.flatMap((entry) =>
      entry.kind === 'api' ? [entry.path] : []
    );

    expect(apiPaths).toEqual([
      '/api/docs/[locale]/[slug]',
      '/api/docs/[locale]/nav',
      '/api/docs/[locale]',
      '/api/search',
    ]);
  });
});
