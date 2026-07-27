# Effuse Docs: Server-Rendered Documentation With A Docs API

**Date:** 2026-07-27
**Status:** Approved for planning
**Scope:** Documentation rendering, the docs navigation index, the sidebar
(desktop and mobile), and the search index. The visual design is unchanged.

## Problem

`effuse-doc` was written against Effuse 1.x and runs as a client-only SPA. The
framework it documents has since shipped a server runtime — layer-owned HTTP
APIs, an SSR runtime, response and data caches, and server middleware — and the
site demonstrates none of it. The documentation site for a framework with SSR
serves an empty `<div id="app">`.

The gap is not only presentational. The current implementation has defects that
a server-rendered architecture removes rather than papers over.

### Declared Versions Do Not Match Installed Versions

`package.json` pins `@effuse/core` 1.2.4 and `pnpm-lock.yaml` agrees, but
`node_modules` contains 2.0.1. The lockfile is stale relative to the tree the
application actually runs against. Three published packages are unused:
`@effuse/server`, `@effuse/use`, and `@effuse/cli`.

| Package | Declared | Current |
| --- | --- | --- |
| `@effuse/core` | 1.2.4 | 2.0.1 |
| `@effuse/query` | 1.0.8 | 2.0.1 |
| `@effuse/router` | 1.1.5 | 1.2.1 |
| `@effuse/ink` | 1.1.4 | 1.2.1 |
| `@effuse/store` | 1.0.8 | 1.1.1 |
| `@effuse/i18n` | 1.0.9 | 1.1.1 |
| `@effuse/compiler` | 1.0.4 | 1.0.5 |
| `@effuse/server` | absent | 1.0.1 |
| `@effuse/use` | absent | 1.2.1 |
| `@effuse/cli` | absent | 1.0.1 |

### Every Locale Ships To Every Visitor

`src/content/docs/index.ts` eagerly globs `./*/*.md` as raw strings. Eighty
markdown files — four locales of twenty documents — are inlined into the client
bundle. A visitor reading one English page downloads the Japanese, Chinese, and
Spanish corpus. `src/utils/docsIndexer.ts` globs the same files a second time
for the search index.

### The Docs Page Bypasses The Router

`/docs/:slug` is a registered route, but `DocsPage` derives its slug from
`window.location.pathname` and subscribes to `popstate` directly. The router's
matched params are ignored. Two navigation systems disagree about what page is
being displayed, and the resolution depends on event ordering.

### Three Heading-Slug Algorithms Compete

Heading anchors are generated in three places with three different rules:

- `pages/Docs/index.tsx` — Unicode-aware, deduplicates with a counter.
- `utils/markdownParser.ts` — ASCII-only (`[^\w\s-]`), a different counter.
- `@effuse/ink`'s internal `generateHeadingId` — Unicode-aware, module-scoped
  counter.

Only Ink's ids reach the DOM. The other two produce the table-of-contents
targets. For any heading containing non-ASCII characters — which is every
heading in the Japanese and Chinese documentation — the parser's id cannot match
the rendered id, so `handleTocClick` falls through to its
`document.querySelectorAll('h1, h2, h3')` text-matching fallback.

### The Sidebar Is A Module-Level Singleton

`Sidebar.tsx` calls `createStableSectionStates()` at module scope. The resulting
signals are created once per process, not once per render. Under SSR this is
state shared across every concurrent request. It must be removed before a server
renders this component, not after.

The same file carries a hand-maintained `labelMapping` record of twenty-five
i18n keys, and a `sectionsConfig` array that has drifted from the content
directory: `query.md`, `ink.md`, and `props.md` exist in all four locales and no
navigation entry reaches them.

### No Crawlable Documentation

Head tags, page titles, and document text are all produced client-side. A
crawler that does not execute JavaScript sees an empty div.

## Goals

1. Server-render every route, with documentation content present in the initial
   HTML.
2. Own documentation content, the navigation index, and search behind an HTTP
   API defined by an Effuse layer.
3. Reduce the client bundle to the locale and document actually being read.
4. Make the router the single source of truth for the current document.
5. Make Ink the single source of truth for heading anchors.
6. Leave the rendered UI pixel-identical.

## Non-Goals

- Redesigning any visual element, including the sidebar, its sections, its
  ordering, and its mobile drawer behaviour.
- Adding the three orphaned documents to the navigation. That is a content
  decision, tracked as its own issue and reported by a diagnostic here.
- Refactoring the demo pages (`Form`, `Todos`, `Props`, `Emit`, `Context`,
  `Components`, `Refs`, `I18n`), the `Releases` page, or the legal pages. They
  must survive SSR; they are not otherwise in scope.
- Translating or editing documentation content.

## Architecture

### One Fetch Handler, Three Hosts

A single module builds the request handler. Development, production, and local
preview differ only in how a request reaches it.

```
                    src/server/handler.ts
                    createDocsHandler(): (Request) => Promise<Response>
                              |
        +---------------------+---------------------+
        |                     |                     |
   Vite dev plugin      api/index.ts          scripts/serve.ts
   (configureServer,    (Vercel Node fn,      (@effuse/server
    ssrLoadModule)       @effuse/server        createNodeServer)
                         convert helpers)
```

`createDocsHandler` composes `createHandler` from `@effuse/core/server` with the
application's layer graph and root component. Layer-owned server routes are
matched before the SSR fallback, so `/api/docs/...` never reaches the renderer
and every page request does.

Production targets Vercel's Node runtime rather than Edge. Effuse's SSR path
uses `node:async_hooks`; the integration app in the framework repository
polyfills it for the browser bundle specifically because it is a Node
dependency. Node is the runtime that already satisfies it.

Static assets are served from the CDN. `vercel.json` rewrites only paths that do
not resolve to a built asset.

### Documentation Is A Layer Capability

`DocsLayer` gains services and server routes. The capability owns content
resolution, the navigation index, and search in one definition — the model the
framework's own wiki describes as capability-first.

```ts
export const DocsLayer = defineLayer({
  name: 'docs',
  services: {
    docs: () => createDocsService(),
  },
  server: {
    api: {
      '/api/docs/[locale]/nav': { GET: ... },
      '/api/docs/[locale]/[slug]': { GET: ... },
      '/api/search': { GET: ... },
    },
  },
});
```

| Route | Returns |
| --- | --- |
| `GET /api/docs/[locale]/nav` | Sections with i18n label keys, hrefs, and an `external` flag |
| `GET /api/docs/[locale]/[slug]` | `{ slug, locale, title, content, toc, prev, next }` |
| `GET /api/search?locale=&q=` | `{ query, results }` |

Handlers validate `locale` and `slug` with `serverSchema` so an unknown locale
returns a typed `400` rather than a silent fallback, and a missing document
returns `404` through `response.error` with a stable code.

The navigation response returns **label keys, not translated labels**. Switching
language must stay instantaneous and must not require a second network round
trip; the client already holds every translation bundle. This preserves current
behaviour exactly.

### Content Loading

Documents load through a lazy glob inside a server-only module:

```ts
const docs = import.meta.glob('../content/docs/*/*.md', {
  query: '?raw',
  import: 'default',
});
```

Lazy — not eager — so Vite emits one chunk per document in the SSR build and
loads exactly the requested file. No generated manifest file and no custom
plugin: Vite already provides per-module splitting, and a generated artifact
would be one more thing to keep in sync.

Validation that the glob cannot provide — orphaned documents, slug collisions
across locales, locales missing a document present in English — moves to a
`docs:check` script run in CI. It reports; it does not mutate navigation.

### Caching

Two independent layers, both opt-in, matching the framework's documented model.

- `cached()` wraps the expensive work: parsing a document into `{ title,
  content, toc }`, and building the per-locale search index. Keyed by locale and
  slug, tagged `docs:<locale>` so a content change invalidates one locale.
- `createResponseCache()` caches the HTTP responses of the docs API at the
  origin, honouring the `revalidate` policy declared on each route.

Both are per-process. On Vercel that means per-instance, which is correct for
immutable build-time content: a deploy replaces the instances.

### The Docs Page

`DocsPage` reads its slug from `useRoute()`. The `window.location` read and the
`popstate` listener are deleted.

The route becomes `/docs/[[...slug]]` — an optional catch-all — so `/docs` and
`/docs/getting-started` resolve through one record instead of two.

On the server, the handler resolves the document before rendering and places it
in the hydration payload. The client reads it from hydration on first paint and
never refetches the document it was served. Subsequent client-side navigations
fetch `/api/docs/[locale]/[slug]` through `@effuse/query`, which supplies
caching, deduplication, and request cancellation.

`<Ink content={...}/>` renders during SSR, so document text is in the initial
HTML. `useSeoMeta` runs on the server, so title, description, Open Graph, and
Twitter tags are in the initial `<head>`.

`renderToString` is chosen over `createStreamingHandler`. Streaming defers
head discovered during render into the hydration payload, where a non-executing
crawler never sees it. For a documentation site, complete head in the initial
HTML outranks time-to-first-chunk.

### Table Of Contents

The TOC is derived on the server from Ink's own parse:

```ts
const ast = parseSync(markdown);
```

Headings are walked from the AST and slugged by a function that reproduces Ink's
`generateHeadingId` exactly, with a **per-document** deduplication counter.

Both existing extractors — `extractTocItems` in `pages/Docs/index.tsx` and
`extractHeadings` in `utils/markdownParser.ts` — are deleted. The text-matching
fallback in `handleTocClick` is deleted with them: once ids are derived from the
same parse that renders them, a lookup by id cannot fail.

Ink does not export `generateHeadingId`, and its `usedHeadingIds` counter is
module-scoped rather than per-document, so ids drift across successive renders
in one process. Both are filed upstream against `chrismichaelps/effuse`. Until
that lands, this repository owns a mirrored implementation with a
character-for-character test against Ink's rendered output.

### Sidebar And Navigation Index

`sectionsConfig` moves out of the component into `src/content/docs/nav.ts`, a
plain data module the server owns and serves. `Sidebar.tsx` renders whatever the
API returns.

`createStableSectionStates()` and its module-level `stableSectionStates`
constant are deleted. Per-section signals are created inside `script`, once per
component instance.

The `labelMapping` record of twenty-five hand-maintained keys is deleted.
Navigation entries carry their i18n key directly and the component resolves it
through `useTranslation`, so adding a navigation entry no longer requires
editing a second lookup table.

Section open/closed state stays in `docsUIStore`. The server renders the same
defaults the store declares, so the hydrated tree matches the served markup.

### Mobile

`src/hooks/useBreakpoint.ts` — 225 lines of hand-rolled matchMedia handling — is
replaced by `useMediaQuery` and `BREAKPOINTS` from `@effuse/use`, which is
SSR-safe by construction and exports `isServer` for the cases that need it.

The server cannot know the viewport. It renders the desktop layout with the
mobile drawer closed, which is what an unhydrated mobile visitor should see, and
the client reconciles on hydration. The drawer's open state is client-only and
never serialised into the hydration payload.

`useSmoothScroll`, `useScrollSpy`, and `useClickOutside` become client-only:
they are registered in `onMount`, which does not run on the server.

### Search

The inverted index, tokenizer, and fuzzy matcher move to the server. Today they
are built in the browser from the full corpus; after this change the browser
holds neither the corpus nor the index.

`GET /api/search?locale=&q=` returns ranked results. `searchStore` keeps its
modal state machine — `Closed`/`Opening`/`Open`/`Closing` — and its keyboard
selection, and replaces `indexDocs()` and local `searchDocs()` with a debounced
query against the API through `@effuse/query`. `SearchModal` and `SearchTrigger`
are untouched.

`utils/searchEngine.ts`, `utils/invertedIndex.ts`, `utils/tokenizer.ts`, and
`utils/fuzzySearch.ts` move under `src/server/` unchanged in behaviour. Their
tests move with them.

## Module Layout

```
api/
  index.ts                  Vercel Node function
src/
  server/
    handler.ts              createDocsHandler()
    content.ts              lazy glob, frontmatter, per-document parse
    toc.ts                  AST -> TocItem[], Ink-compatible slugs
    search/                 index, tokenizer, fuzzy (moved, unchanged)
    cache.ts                cached() wrappers and the response cache
  entry-client.ts           hydration entry
  entry-server.ts           SSR entry
  content/docs/
    nav.ts                  navigation index (data only)
    *.md                    unchanged
  layers/DocsLayer.ts       services + server.api
scripts/
  serve.ts                  local production preview
  docs-check.ts             orphan / collision / locale-parity diagnostics
```

`src/content/docs/index.ts` and `src/utils/docsIndexer.ts` are deleted; nothing
imports the eager glob afterwards.

## Errors

Server failures use the framework's typed error path rather than ad-hoc status
codes.

| Condition | Response |
| --- | --- |
| Unknown locale | `400 EFFUSE_VALIDATION_FAILED` from `serverSchema` |
| Unknown slug | `404 DOC_NOT_FOUND` via `response.error` |
| Malformed frontmatter | Logged; document served with a filename-derived title |
| Search query under 2 characters | `200` with an empty result set, matching current client behaviour |
| Render failure | `500` with the request id; `onError` on the handler reports it |

The client's existing tagged errors in `src/errors/` are kept. `search.ts` is
rewritten against API failures instead of local index failures.

## Testing

The repository has no test runner today. This adds `vitest`, matching the
framework's own choice, with tests scoped to the logic this refactor introduces
or moves.

- **TOC slugs** — every heading in all eighty documents is slugged by
  `src/server/toc.ts` and by an actual Ink render, and the two id sets must be
  identical. This is the test that proves the anchor defect fixed.
- **Content resolution** — frontmatter title, H1 fallback, filename fallback,
  unknown slug, unknown locale, locale fallback to English.
- **Navigation index** — the served nav is deep-equal to the current
  `sectionsConfig`, section for section and item for item. This is the guard on
  "the UI does not change".
- **Search** — the API returns, for a fixed set of queries, the same ranked ids
  the current client engine returns for the same corpus.
- **SSR smoke** — `renderToString` for `/`, `/docs`, `/docs/getting-started`,
  and one non-Latin locale returns HTML containing the document's first heading
  and a populated `<title>`.
- **Demo-page SSR** — every route renders without throwing. This is the audit
  that catches a demo page touching `window` during `script`.

`docs:check` runs in CI and fails on a slug collision or a locale-parity break;
orphaned documents are reported as a warning, since removing that warning is a
content decision.

## Risks

**Demo pages may touch the DOM during `script`.** They were written with no
server in mind. Mitigation: the SSR smoke test covers every route, and offending
access moves into `onMount` or behind `isServer()`. Guarding, not rewriting.

**Ink's module-scoped heading counter drifts across renders.** Two renders of
the same document in one process can produce different ids for duplicate
headings. Mitigation: the TOC is derived per document with its own counter, and
the parity test would catch a divergence. Filed upstream.

**A stale lockfile hides a real break.** `node_modules` and `pnpm-lock.yaml`
disagree today, so the tree is not reproducible. Mitigation: the version bump
and a clean `pnpm install` land as the first slice, before any refactoring, so a
2.x API break is attributed to the upgrade rather than to this work.

**Vercel function bundling may miss lazily-globbed markdown.** Mitigation: the
production preview script serves the real build locally, and the SSR smoke test
runs against that build rather than against dev.

## Sequencing

Each slice leaves the site working.

1. **Dependencies** — bump every effuse package to current, add `@effuse/server`
   and `@effuse/use`, regenerate the lockfile, fix 2.x API breaks. No behaviour
   change.
2. **Server foundation** — `createDocsHandler`, the dev bridge, the Vercel
   function, the preview script, `entry-client`/`entry-server`. The site renders
   server-side with its current logic intact.
3. **Docs API** — `DocsLayer` services and routes, content module, TOC module,
   caching. Nothing consumes them yet.
4. **Docs page** — route to `[[...slug]]`, slug from `useRoute()`, content from
   hydration then from the API, TOC from the server. Delete the two extractors,
   the eager glob, and the `popstate` listener.
5. **Navigation and sidebar** — `nav.ts`, the nav route, sidebar consumes it,
   module-level singleton and `labelMapping` deleted.
6. **Mobile** — `@effuse/use` media queries, client-only scroll hooks.
7. **Search** — engine to the server, store to the API, client-side index
   deleted.
8. **Diagnostics and tests** — `docs:check`, the vitest suite, CI wiring.

## Success Criteria

- `curl https://<host>/docs/getting-started` returns HTML containing the
  document's headings and a populated `<title>` and `<meta name="description">`.
- No markdown for any locale other than the one being read appears in a client
  chunk.
- Every table-of-contents link resolves by id, in all four locales, with no
  text-matching fallback in the codebase.
- The rendered sidebar — sections, order, labels, open state, collapse and
  mobile drawer behaviour — is unchanged, proven by the nav deep-equality test.
- `grep -r 'window\.\|document\.' src/server src/content` returns nothing.
- No module-level mutable state remains in any server-rendered component.
