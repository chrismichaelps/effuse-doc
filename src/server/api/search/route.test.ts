import { describe, expect, it } from 'vitest';
import { createInProcessRouteFetch } from '@effuse/core/server';
import type { SearchResponse } from '../../../content/search/types.js';
import { AppServerLayer } from '../../../layers/AppServerLayer.js';
import { SEARCH_MAX_QUERY_LENGTH } from '../../../content/search/config.js';
import { metadata } from './route.js';

const EXPECTED_RANKINGS = {
  signals: [
    'signals-title',
    'props-code',
    'state-code',
    'getting-started-content',
  ],
  server: [
    'server-title',
    'server-apis-title',
    'cli-heading',
    'migrating-layer-access-heading',
    'layers-heading',
    'why-effuse-code',
    'installation-code',
    'refs-code',
    'effects-code',
  ],
  useForm: ['use-form-title'],
  layers: [
    'layers-title',
    'migrating-layer-access-heading',
    'hooks-heading',
    'why-effuse-code',
    'getting-started-code',
    'ink-code',
    'server-code',
    'server-apis-code',
  ],
  router: [
    'installation-heading',
    'routing-heading',
    'getting-started-heading',
    'layers-code',
    'quick-start-code',
  ],
} as const;

describe('GET /api/search', () => {
  const routeFetch = createInProcessRouteFetch([AppServerLayer]);

  it('declares a shared five-minute response cache policy', () => {
    expect(metadata).toEqual({
      cache: { revalidate: 300, tags: ['search', 'docs'] },
    });
  });

  it.each(Object.entries(EXPECTED_RANKINGS))(
    'keeps deterministic rankings for %s',
    async (query, expectedIds) => {
      const url = new URL('http://effuse.local/api/search');
      url.searchParams.set('locale', 'en');
      url.searchParams.set('q', query);

      const response = await routeFetch(url);
      expect(response.status).toBe(200);

      const payload = (await response.json()) as SearchResponse;
      expect(payload.results.map((result) => result.id)).toEqual(expectedIds);
    }
  );

  it.each([
    ['sig', 'signals'],
    ['signlas', 'signals'],
  ])('finds %s as %s', async (query, expectedDocument) => {
    const response = await routeFetch(
      `http://effuse.local/api/search?locale=en&q=${query}`
    );
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results[0]?.documentId).toBe(expectedDocument);
  });

  it('returns code snippets first for a literal code query', async () => {
    const response = await routeFetch(
      'http://effuse.local/api/search?locale=en&q=define%28'
    );
    const payload = (await response.json()) as SearchResponse;

    expect(payload.results[0]?.matchedIn).toBe('code');
    expect(payload.results[0]?.text).toContain('define(');
    expect(payload.results[0]?.code?.lines.length).toBeGreaterThan(0);
    expect(payload.results[0]?.code?.lines.length).toBeLessThanOrEqual(7);
  });

  it('rejects a request without a query', async () => {
    const response = await routeFetch(
      'http://effuse.local/api/search?locale=en'
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: {
        code: 'EFFUSE_VALIDATION_FAILED',
        source: 'query',
      },
    });
  });

  it.each([
    ['blank query', 'locale=en&q=%20%20'],
    [
      'oversized query',
      `locale=en&q=${'x'.repeat(SEARCH_MAX_QUERY_LENGTH + 1)}`,
    ],
    ['unsupported locale', 'locale=fr&q=signals'],
    ['control characters', 'locale=en&q=signals%00'],
    ['unexpected parameters', 'locale=en&q=signals&debug=true'],
  ])('rejects %s', async (_case, search) => {
    const response = await routeFetch(
      `http://effuse.local/api/search?${search}`
    );

    expect(response.status).toBe(400);
  });
});
