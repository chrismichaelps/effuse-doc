import { describe, expect, it } from 'vitest';
import { createFetchHandler } from './entry-server.js';
import { SearchResponseSchema } from './domains/search/contracts/search.schema.js';

const template = `<!doctype html>
<html lang="en">
  <head><title>Effuse</title></head>
  <body><div id="app"><!--effuse-outlet--></div></body>
</html>`;

describe('server entry dispatch', () => {
  const handler = createFetchHandler({ template });

  it('dispatches the file-derived search endpoint before SSR fallback', async () => {
    const response = await handler(
      new Request('http://effuse.local/api/search?locale=en&q=define%28')
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');

    const payload = SearchResponseSchema.parse(await response.json());
    expect(payload.results[0]?.matchedIn).toBe('code');
  });

  it('renders documentation page content on the server', async () => {
    const response = await handler(
      new Request('http://effuse.local/docs/layers')
    );
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('text/html');
    expect(html).toContain('Layers');
    expect(html).toContain('id="__EFFUSE_DATA__"');
  });

  it('renders the homepage product story on the server', async () => {
    const response = await handler(new Request('http://effuse.local/'));
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain('From signal to server');
    expect(html).toContain('Application examples');
    expect(html).toContain('Capability architecture');
    expect(html).toContain('Server and SSR');
  });
});
