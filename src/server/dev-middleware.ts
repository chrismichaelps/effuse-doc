import type { Connect, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

/**
 * Serves the Effuse server routes over HTTP in dev by bridging Node's req/res
 * to a Web `Request`.
 *
 * The handler is reloaded via `ssrLoadModule` per request so route edits apply
 * without a restart.
 */

const HANDLED_PREFIXES = ['/api/', '/_effuse/'] as const;

const isHandled = (url: string): boolean =>
	HANDLED_PREFIXES.some((prefix) => url.startsWith(prefix));

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
): Request => {
	const origin = `http://${req.headers.host ?? 'localhost'}`;
	return new Request(new URL(url, origin), {
		method: req.method,
		headers: req.headers as Record<string, string>,
		...(body ? { body: new Uint8Array(body) } : {}),
	});
};

export const effuseDevApi = (): {
	name: string;
	configureServer: (server: ViteDevServer) => void;
} => ({
	name: 'effuse-dev-api',
	configureServer(server: ViteDevServer) {
		const handle: Connect.NextHandleFunction = (req, res, next) => {
			const url = req.originalUrl ?? req.url ?? '';

			if (!isHandled(url)) {
				next();
				return;
			}

			void (async () => {
				try {
					const module = await server.ssrLoadModule('/src/server/handler.ts');
					const fetchHandler = module.createDocsHandler() as (
						request: Request
					) => Promise<Response>;

					const body = await readBody(req);
					const response = await fetchHandler(toWebRequest(req, url, body));

					res.statusCode = response.status;
					response.headers.forEach((value, key) => res.setHeader(key, value));
					res.end(Buffer.from(await response.arrayBuffer()));
				} catch (error) {
					server.ssrFixStacktrace(error as Error);
					res.statusCode = 500;
					res.setHeader('content-type', 'application/json');
					res.end(JSON.stringify({ error: String(error) }));
				}
			})();
		};

		server.middlewares.use(handle as (
			req: IncomingMessage,
			res: ServerResponse,
			next: () => void
		) => void);
	},
});
