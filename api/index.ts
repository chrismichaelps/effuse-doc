import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { toWebRequest, writeWebResponse } from '@effuse/server';

/**
 * Vercel Node function.
 *
 * Node rather than Edge: the SSR path depends on node:async_hooks for
 * per-request layer context.
 *
 * The built server bundle and the built client shell are loaded once per
 * process; the shell must be the built index.html because the source file
 * references /src/main.ts, which does not exist in production.
 */

type FetchHandler = (request: Request) => Promise<Response>;

const clientDir = path.resolve(process.cwd(), 'dist/client');

let handlerPromise: Promise<FetchHandler> | undefined;

const loadHandler = async (): Promise<FetchHandler> => {
  const entry = (await import(
    // @ts-ignore
    /* @vite-ignore */ '../dist/server/entry-server.js'
  )) as {
    createFetchHandler: (options: { template: string }) => FetchHandler;
  };

  return entry.createFetchHandler({
    template: await readFile(path.join(clientDir, 'index.html'), 'utf8'),
  });
};

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
): Promise<void> {
  const controller = new AbortController();
  const abortIfUnfinished = (): void => {
    if (!res.writableEnded) controller.abort();
  };
  req.on('aborted', abortIfUnfinished);
  res.on('close', abortIfUnfinished);

  handlerPromise ??= loadHandler();
  const fetchHandler = await handlerPromise;
  const request = toWebRequest(req, 'localhost', controller.signal);
  const response = await fetchHandler(request);

  await writeWebResponse(
    res,
    response,
    controller.signal,
    req.method === 'HEAD'
  );
}
