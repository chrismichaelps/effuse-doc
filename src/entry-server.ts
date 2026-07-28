import { createHandler, createInProcessRouteFetch } from '@effuse/core/server';
import type { AssetManifest } from '@effuse/core/server';
import { createMemoryHistory, runWithRouter } from '@effuse/router';
import enTranslations from '../public/locales/en.json';
import { App } from './App';
import { DEFAULT_LOCALE, DEFAULT_SLUG } from './content/docs/constants';
import { createAppRouter } from './router';
import { serverLayers } from './server/layers';
import { queryClient } from './store/queryClient';
import { i18nStore, type Translations } from './store/appI18n';
import type { Doc } from './content/docs/types';

export interface ServerEntryOptions {
  /** The built client `index.html`, used as the document shell. */
  readonly template: string;
  /** Parsed Vite client manifest, so asset tags match the built filenames. */
  readonly manifest?: AssetManifest;
}

/**
 * Builds the request handler.
 *
 * Server routes are matched before the SSR fallback, so `/api/docs/...` never
 * reaches the renderer and every page request does.
 *
 * Non-streaming: the streaming handler defers head discovered during render
 * into the hydration payload, where a crawler that does not execute JavaScript
 * never sees it. Complete `<head>` in the initial HTML matters more here than
 * time-to-first-chunk.
 */
export const createFetchHandler = (
  options: ServerEntryOptions
): ((request: Request) => Promise<Response>) => {
  // The server renders in the default locale. Browser locale detection runs
  // after hydration, but the initial document must already contain readable
  // navigation, legal copy, and route metadata.
  i18nStore.translations.value = enTranslations as Translations;

  const handler = createHandler({
    root: App,
    layers: serverLayers,
    options: {
      template: options.template,
      manifest: options.manifest,
      hydrate: true,
    },
    onError: (error, request) => {
      // Render failures wrap the original error; without the cause the log
      // says only "Render failed" and never points at the offending code.
      const cause = (error as { cause?: unknown }).cause;
      console.error(
        `[ssr] ${request.method} ${request.url}`,
        error,
        cause instanceof Error ? cause.stack : cause
      );
    },
  });
  const routeFetch = createInProcessRouteFetch(serverLayers);

  const preloadDoc = async (url: URL): Promise<void> => {
    if (url.pathname !== '/docs' && !url.pathname.startsWith('/docs/')) return;

    const encodedSlug = url.pathname.slice('/docs/'.length);
    const slug = encodedSlug ? decodeURIComponent(encodedSlug) : DEFAULT_SLUG;
    const key = ['docs', DEFAULT_LOCALE, slug] as const;
    if (queryClient.getQueryData<Doc>(key)) return;

    const apiUrl = new URL(
      `/api/docs/${DEFAULT_LOCALE}/${encodeURIComponent(slug)}`,
      url
    );
    const response = await routeFetch(apiUrl);
    if (!response.ok) return;

    queryClient.setQueryData<Doc>(key, (await response.json()) as Doc);
  };

  return async (request) => {
    const url = new URL(request.url);
    const routePath = `${url.pathname}${url.search}${url.hash}`;
    const requestRouter = createAppRouter(createMemoryHistory(routePath));

    await preloadDoc(url);
    return runWithRouter(requestRouter, () => handler(request));
  };
};
