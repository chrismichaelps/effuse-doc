import { describe, expect, it } from 'vitest';
import { createInProcessRouteFetch } from '@effuse/core/server';
import type { SearchResponse } from '../../../content/search/types.js';
import { AppServerLayer } from '../../../layers/AppServerLayer.js';

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
    'getting-started-code',
    'why-effuse-code',
    'ink-code',
    'server-code',
    'server-apis-code',
  ],
  router: [
    'installation-heading',
    'getting-started-heading',
    'routing-heading',
    'ink-code',
    'layers-code',
    'quick-start-code',
  ],
} as const;

describe('GET /api/search', () => {
  const routeFetch = createInProcessRouteFetch([AppServerLayer]);

  it.each(Object.entries(EXPECTED_RANKINGS))(
    'preserves the client engine ranking for %s',
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
});
