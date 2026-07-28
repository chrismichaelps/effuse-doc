import { createHandler, createResponseCache } from '@effuse/core/server';
import { App } from '../App';
import { serverLayers } from './layers';

/**
 * The application fetch handler, shared by the dev middleware, the Vercel
 * function in `api/`, and `scripts/serve.ts`.
 *
 * Server routes are matched before the SSR fallback.
 */

/** Origin response cache. Per-process; a deploy replaces the instances. */
const responseCache = createResponseCache({ maxEntries: 500 });

export const createDocsHandler = (): ((
  request: Request
) => Promise<Response>) =>
  createHandler({
    root: App,
    layers: serverLayers,
    // Non-streaming: streaming defers late <head> into the hydration payload,
    // which a non-executing crawler never sees.
    onError: (error, request) => {
      console.error(`[ssr] ${request.method} ${request.url}`, error);
    },
  });

export { responseCache };
