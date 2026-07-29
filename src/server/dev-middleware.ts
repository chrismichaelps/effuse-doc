import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage } from 'node:http';
import type { Plugin, ViteDevServer } from 'vite';

/**
 * Runs the production request handler in development.
 *
 * Development previously served only `/api/*` through a separate handler while
 * pages fell through to Vite's static shell, so server rendering was exercised
 * for the first time at build. This registers after Vite's own middlewares and
 * serves every remaining request through `createFetchHandler` — the same entry
 * `api/` and `scripts/serve.mjs` use — so dev, preview and production run one
 * code path.
 *
 * `ssrLoadModule` reloads the entry per request, so route, layer and content
 * edits apply without restarting.
 */

type FetchHandler = (request: Request) => Promise<Response>;

interface ServerEntry {
  createFetchHandler: (options: { template: string }) => FetchHandler;
}

const readBody = async (req: IncomingMessage): Promise<Buffer | undefined> => {
  if (req.method === 'GET' || req.method === 'HEAD') return undefined;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  return chunks.length ? Buffer.concat(chunks) : undefined;
};

const toWebRequest = (
  req: IncomingMessage,
  url: string,
  body: Buffer | undefined
): Request =>
  new Request(new URL(url, `http://${req.headers.host ?? 'localhost'}`), {
    method: req.method,
    headers: req.headers as Record<string, string>,
    ...(body ? { body: new Uint8Array(body) } : {}),
  });

export const effuseDevApi = (): Plugin => ({
  name: 'effuse-dev-ssr',
  // Returning a function defers registration until after Vite's own
  // middlewares, so module, asset and HMR requests are served normally and
  // only what remains reaches the renderer.
  configureServer(server: ViteDevServer) {
    return () => {
      server.middlewares.use((req, res, next) => {
        const url = req.originalUrl ?? req.url ?? '/';

        void (async () => {
          try {
            const entry = (await server.ssrLoadModule(
              '/src/entry-server.ts'
            )) as unknown as ServerEntry;

            // transformIndexHtml injects the HMR client and Vite's module
            // preamble, which the built template already carries.
            const template = await server.transformIndexHtml(
              url,
              await readFile(
                path.resolve(server.config.root, 'index.html'),
                'utf8'
              )
            );

            const response = await entry.createFetchHandler({ template })(
              toWebRequest(req, url, await readBody(req))
            );

            res.statusCode = response.status;
            response.headers.forEach((value, key) => res.setHeader(key, value));
            res.end(Buffer.from(await response.arrayBuffer()));
          } catch (error) {
            server.ssrFixStacktrace(error as Error);
            next(error);
          }
        })();
      });
    };
  },
});
