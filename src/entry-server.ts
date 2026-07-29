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

/**
 * Re-attaches the client entry script.
 *
 * `createHandler` strips the template's `<script type="module">` and, when a
 * manifest is supplied, emits only `<link rel="modulepreload">`. The bundle is
 * therefore fetched but never executed: the page renders, nothing hydrates,
 * and every `Link` falls back to a full document load. Tracked upstream.
 */
const entrySrcFrom = (manifest?: AssetManifest): string | undefined => {
  const entry = Object.values(manifest ?? {}).find((chunk) => chunk.isEntry);
  return entry ? `/${entry.file}` : undefined;
};

const withClientEntry = async (
  response: Response,
  entrySrc: string
): Promise<Response> => {
  if (!response.headers.get('content-type')?.includes('text/html')) {
    return response;
  }

  const html = await response.text();
  if (html.includes(`src="${entrySrc}"`)) return response;

  const tag = `<script type="module" src="${entrySrc}"></script>`;
  const body = html.includes('</body>')
    ? html.replace('</body>', `${tag}</body>`)
    : html + tag;

  // Carrying the original headers over would keep its Content-Length, and the
  // response would be truncated mid-tag by exactly the bytes just added.
  const headers = new Headers(response.headers);
  headers.delete('content-length');

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

/** Matches DocsPage: `[[...slug]]` yields an array, a string, or nothing. */
const toDocSlug = (value: unknown): string => {
  if (Array.isArray(value)) return value.join('/') || DEFAULT_SLUG;
  if (typeof value === 'string' && value.length > 0) return value;
  return DEFAULT_SLUG;
};

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
    // Documentation is immutable for the lifetime of a deploy, so a CDN may
    // hold the rendered HTML. The origin still revalidates after the window.
    cacheSMaxAge: 3600,
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

  /**
   * Seeds the query cache so the document is present in the first render.
   *
   * The slug comes from the router's own match rather than from slicing the
   * pathname, so the optional catch-all stays defined in exactly one place.
   */
  const preloadDoc = async (
    router: ReturnType<typeof createAppRouter>,
    url: URL
  ): Promise<void> => {
    const matched = router.resolve(`${url.pathname}${url.search}`);
    if (matched.name !== 'docs') return;

    const slug = toDocSlug(matched.params.slug);
    const key = ['docs', DEFAULT_LOCALE, slug] as const;
    if (queryClient.getQueryData<Doc>(key)) return;

    const response = await routeFetch(
      new URL(`/api/docs/${DEFAULT_LOCALE}/${encodeURIComponent(slug)}`, url)
    );
    if (!response.ok) return;

    queryClient.setQueryData<Doc>(key, (await response.json()) as Doc);
  };

  const entrySrc = entrySrcFrom(options.manifest) ?? '/src/main.ts';

  return async (request) => {
    const url = new URL(request.url);
    const routePath = `${url.pathname}${url.search}${url.hash}`;
    const requestRouter = createAppRouter(createMemoryHistory(routePath));

    await preloadDoc(requestRouter, url);
    return withClientEntry(
      await runWithRouter(requestRouter, () => handler(request)),
      entrySrc
    );
  };
};
