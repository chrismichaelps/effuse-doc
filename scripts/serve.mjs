import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createNodeServer } from '@effuse/server';

/**
 * Local production preview.
 *
 * Serves the built output through the same handler the Vercel function uses,
 * so what is verified here is what ships.
 */

const clientDir = path.resolve(process.cwd(), 'dist/client');

const readJson = async (file) => {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return undefined;
  }
};

const { createFetchHandler } = await import('../dist/server/entry-server.js');

const handler = createFetchHandler({
  template: await readFile(path.join(clientDir, 'index.html'), 'utf8'),
  manifest: await readJson(path.join(clientDir, '.vite/manifest.json')),
});

const port = Number(process.env.PORT ?? 3000);
const server = createNodeServer(handler);

await server.listen({ port });
console.log(`[serve] http://localhost:${port}`);
