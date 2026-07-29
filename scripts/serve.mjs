import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createNodeServer } from '@effuse/server';

/**
 * Local production preview.
 *
 * Serves the built output through the same handler the Vercel function uses,
 * so what is verified here is what ships.
 */

const clientDir = path.resolve(process.cwd(), 'dist/client');

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
  ['.woff', 'font/woff'],
  ['.woff2', 'font/woff2'],
]);

const serveAsset = async (request) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') return undefined;

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url).pathname);
  } catch {
    return new Response(null, { status: 400 });
  }

  const file = path.resolve(clientDir, `.${pathname}`);
  if (file !== clientDir && !file.startsWith(`${clientDir}${path.sep}`)) {
    return new Response(null, { status: 403 });
  }

  try {
    if (!(await stat(file)).isFile()) return undefined;
    const extension = path.extname(file).toLowerCase();
    const headers = new Headers({
      'cache-control': pathname.startsWith('/assets/')
        ? 'public, max-age=31536000, immutable'
        : 'public, max-age=0, must-revalidate',
    });
    const contentType = contentTypes.get(extension);
    if (contentType) headers.set('content-type', contentType);
    return new Response(await readFile(file), { headers });
  } catch (error) {
    if (error?.code === 'ENOENT' || error?.code === 'EISDIR') return undefined;
    throw error;
  }
};

const readJson = async (file) => {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return undefined;
  }
};

const { createFetchHandler } = await import('../dist/server/entry-server.js');

const appHandler = createFetchHandler({
  template: await readFile(path.join(clientDir, 'index.html'), 'utf8'),
  manifest: await readJson(path.join(clientDir, '.vite/manifest.json')),
});

const handler = async (request) =>
  (await serveAsset(request)) ?? appHandler(request);

const port = Number(process.env.PORT ?? 3000);
const server = createNodeServer(handler);

await server.listen({ port });
console.log(`[serve] http://localhost:${port}`);
