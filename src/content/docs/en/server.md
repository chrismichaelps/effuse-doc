---
title: Server & APIs
---

# Server & APIs

Effuse uses Web-standard `Request` and `Response` objects from route definition
to runtime adapter. The same application handler runs on the reference Node and
Bun servers, in process during tests, or behind a conforming deployment adapter.

## File-based API routes

Place API handlers under `src/server/api`. Folders become URL segments,
`[id]` creates a dynamic parameter, `[...slug]` captures the remainder, and
route groups such as `(admin)` organize files without changing the URL.

```txt
src/server/api/health/route.ts
src/server/api/users/[id]/route.ts
src/server/middleware/auth.ts
```

A method export is enough for a simple route:

```ts
// src/server/api/health/route.ts
export const GET = () => ({ ok: true });
```

## Type-inferred params and contracts

Use `defineServerFileHandler` when the handler needs compile-time knowledge of
its path. The literal path is checked against the file-derived path, preventing
a route from silently drifting during refactoring.

```ts
// src/server/api/users/[id]/route.ts
import {
  defineServerFileHandler,
  defineServerRequest,
  serverSchema,
} from '@effuse/core/server';

const request = defineServerRequest({
  params: serverSchema.object({ id: serverSchema.string }),
  query: serverSchema.object({ limit: serverSchema.numberFromString }),
});

const response = serverSchema.object({
  id: serverSchema.string,
  limit: serverSchema.number,
});

export const GET = defineServerFileHandler(
  '/api/users/[id]',
  { request, response },
  ({ input }) => ({
    id: input.params.id,
    limit: input.query.limit,
  })
);
```

`input.params.id` is inferred as `string`, `input.query.limit` as `number`, and
the handler result must satisfy the response contract. Effuse schemas are
public, framework-owned values; application developers do not install or import
the internal validation engine.

Invalid input returns a stable `400` body with the
`EFFUSE_VALIDATION_FAILED` code and structured issues.

## Middleware

Middleware can match paths, methods, and targets. Request-phase middleware can
short-circuit, rewrite the request, call the next stage, and decorate the
response.

```ts
// src/server/middleware/auth.ts
import { defineServerMiddleware } from '@effuse/core/server';

export default defineServerMiddleware({
  name: 'admin-auth',
  phase: 'request',
  order: 10,
  match: {
    paths: '/api/admin/[...rest]',
    methods: ['GET', 'POST'],
    targets: 'api',
  },
  handler: ({ request }, next) => {
    if (request.headers.get('authorization') !== 'Bearer expected-token') {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return next();
  },
});
```

The compiled middleware graph produces deterministic engine, global, layer,
route, and file ordering. Request cleanup runs even after aborts, exceptions,
or short-circuits, and rewrite loops are bounded.

## Layer-owned APIs and actions

File routes provide discoverability. Layers remain the canonical capability
graph for services, routes, actions, middleware, and policy:

```ts
const UsersLayer = defineLayer({
  name: 'users',
  services: { users: () => userRepository },
  server: {
    api: {
      '/api/users/[id]': {
        GET: ({ params, services }) => services.users.find(params.id),
        cache: { maxAge: 60, tags: ['users'] },
      },
    },
    actions: {
      refresh: ({ services }) => services.users.refresh(),
    },
  },
});
```

`createLayerActionClient(UsersLayer)` creates a typed browser client for layer
actions. `createLayerServerManifest()` and the CLI manifest command expose the
same graph to adapters and generated clients.

## Response and data caches

Portable caches are exported by core and may be wired into route dispatch:

```ts
import { createDataCache, createResponseCache } from '@effuse/core/server';

const responses = createResponseCache({ maxEntries: 1_000 });
const data = createDataCache({ maxEntries: 5_000 });

const getUser = data.cached(
  'users:by-id',
  async (id: string) => database.users.find(id),
  { life: { stale: 30_000, expire: 300_000 }, tags: ['users'] }
);
```

Both caches support bounded storage, single-flight work, tag invalidation, and
observable events. Invalidate tags after mutations instead of scattering key
knowledge through handlers.

## Portable storage, tasks, and plugins

`@effuse/server` includes process infrastructure that is independent of the
HTTP adapter:

```ts
import {
  createMemoryStorage,
  createPluginHost,
  createTaskScheduler,
} from '@effuse/server';

const storage = createMemoryStorage({ maxEntries: 10_000 });
const sessions = storage.namespace('sessions');
await sessions.set('s1', { userId: 'u1' }, { ttlMs: 3_600_000 });

const tasks = createTaskScheduler();
tasks.register({
  name: 'expire-sessions',
  intervalMs: 60_000,
  run: async ({ signal }) => {
    if (!signal.aborted) await removeExpiredSessions();
  },
});

const plugins = createPluginHost();
plugins.use({
  name: 'tasks',
  setup: async ({ onTeardown }) => {
    tasks.start();
    onTeardown(() => tasks.stop());
    return tasks;
  },
});
await plugins.start();
```

Storage supports namespaces, TTL, structural isolation, and LRU bounds. The task
scheduler prevents overlapping runs and aborts work during bounded shutdown.
The plugin host starts in registration order, rolls back partial startup, and
tears down in reverse order.

## Node and Bun adapters

```ts
import { createNodeServer } from '@effuse/server/node';
import { handleRequest } from './entry-server';

const server = createNodeServer(handleRequest, {
  maxBodyBytes: 5 * 1024 * 1024,
  onError: (error) => logger.error(error),
});

await server.listen({ host: '127.0.0.1', port: 3000 });
process.on('SIGTERM', () => void server.close({ timeoutMs: 10_000 }));
```

Replace the import with `@effuse/server/bun` and `createBunServer` for Bun. Both
reference adapters pass the shared conformance suite for streaming, request
cancellation, graceful shutdown, multipart bodies, multiple cookies, and
ephemeral ports.

## Production checklist

- Validate params, query, headers, and request bodies at the route boundary.
- Set body limits and shutdown budgets explicitly.
- Keep secrets and server adapters out of browser dependency graphs.
- Attach cache, CORS, runtime, region, and duration policy to the owning route.
- Run the generated manifest check in CI and test handlers through `server.fetch`.
- Use the conformance suite before publishing a custom runtime adapter.
