---
title: Server APIs And Actions
---

# Server APIs And Actions

Effuse server features extend the layer graph. A capability owns its services,
HTTP routes, actions, validation, failures, middleware, metadata, manifest
entries, and client contract in one definition.

## API Routes

```ts
import { defineLayer, LayerServerError } from '@effuse/core';

export const UsersLayer = defineLayer({
  name: 'users',
  services: {
    users: () => ({
      find: (id: string) => ({ id, name: 'Chris' }),
      create: (name: string) => ({ id: crypto.randomUUID(), name }),
    }),
  },
  server: {
    api: {
      '/api/users/[id]': {
        GET: ({ params, services }) => {
          const user = services.users.find(params.id);
          if (!user) {
            throw new LayerServerError('USER_NOT_FOUND', 'User not found.', {
              status: 404,
              details: { id: params.id },
            });
          }
          return user;
        },
      },
    },
  },
});
```

Handlers receive the request URL, params, query, layer services, all layer
service bags, body readers, validation, response helpers, and request context.
Plain objects are serialized as JSON; `Response` values pass through.

## Validation And Forms

Validators may be functions or schema objects with `parse` or `safeParse`.

```ts
const parseLogin = (value: unknown): { email: string; password: string } => {
  const input = value as Record<string, unknown>;
  if (
    !input ||
    typeof input.email !== 'string' ||
    typeof input.password !== 'string'
  ) {
    throw new Error('email and password are required');
  }
  return { email: input.email, password: input.password };
};

export const AuthLayer = defineLayer({
  name: 'auth',
  services: {
    auth: () => ({
      login: (email: string, password: string) =>
        password === 'secret' ? { id: 'u1', email } : null,
    }),
  },
  server: {
    api: {
      '/api/auth/login': {
        POST: async ({ validate, services, response }) => {
          const input = await validate.formData(parseLogin);
          const user = services.auth.login(input.email, input.password);
          if (!user) {
            return response.error('INVALID_CREDENTIALS', 'Login failed.', {
              status: 401,
            });
          }
          return response.redirect('/dashboard', 303);
        },
      },
    },
  },
});
```

Validation failures return `400` with `EFFUSE_VALIDATION_FAILED`, the input
source, and normalized issues. Domain failures use `LayerServerError` or
`response.error(code, message, options)`.

## Uploads

```ts
const UploadLayer = defineLayer({
  name: 'uploads',
  server: {
    api: {
      '/api/uploads': {
        POST: async ({ formData, response }) => {
          const data = await formData();
          const file = data.get('file');
          if (!(file instanceof File)) {
            return response.error('FILE_REQUIRED', 'Select a file.', {
              status: 400,
            });
          }
          return { name: file.name, size: file.size, type: file.type };
        },
      },
    },
  },
});
```

Effuse parses multipart data but does not choose storage. Stream or persist the
file through a layer service so storage policy remains replaceable and testable.

## Actions

Actions are layer-scoped POST operations for domain mutations that do not need a
public route shape.

```ts
export const CartLayer = defineLayer({
  name: 'cart',
  services: {
    cart: () => ({ refresh: () => ({ total: 42 }) }),
  },
  server: {
    actions: {
      refresh: ({ services }) => services.cart.refresh(),
    },
  },
});

const cartActions = createLayerActionClient(CartLayer);
const cart = await cartActions.refresh();
```

Action URLs include the layer name:

```text
/_effuse/actions/cart/refresh
```

Two layers may therefore own an action with the same local name without a
collision:

```ts
const authActions = createLayerActionClient(AuthLayer);
const billingActions = createLayerActionClient(BillingLayer);

await authActions.refresh();
await billingActions.refresh();
```

The legacy unscoped action URL exists for compatibility. New clients should use
the layer object or a manifest client so action ownership remains explicit.

## Manifests And Typed Clients

```ts
const manifest = createLayerServerManifest([UsersLayer, CartLayer]);
const client = createLayerServerManifestClient(manifest, {
  baseUrl: 'https://example.com',
});

await client.route('/api/users/[id]', {
  method: 'GET',
  params: { id: 'u1' },
});

await client.action('cart', 'refresh');
```

Literal manifests constrain layer names, actions, route paths, methods, and
params. `generateLayerServerClientModule` emits a deterministic module with the
manifest, factory, and inferred client type.

## File-System Adapter

Teams that prefer Next-style folders can map them into a layer:

```ts
import {
  defineLayer,
  fromServerFiles,
  type ServerActionFileModule,
  type ServerApiFileModule,
} from '@effuse/core';

const files = import.meta.glob<ServerApiFileModule | ServerActionFileModule>(
  ['/src/server/api/**/*.ts', '/src/server/actions/**/*.ts'],
  { eager: true }
);

export const AppServerLayer = defineLayer({
  name: 'app-server',
  server: fromServerFiles(files),
});
```

Default roots include `src/server/api`, `app/api`, `src/api`,
`src/server/actions`, `app/actions`, and `src/actions`. Bracket params and route
groups map to the same runtime matcher and manifest. Duplicate or ambiguous
files become manifest diagnostics.

The folder convention is an input adapter. It does not create a second server
runtime beside layers.

## Request Pipeline

```text
request
  -> route match
  -> dependency-ordered layer middleware
  -> route/action middleware
  -> validation and handler
  -> metadata response policy
  -> trace event
  -> SSR fallback when no server endpoint matched
```

Route/action metadata supports cache, CORS, runtime, region, duration, and
custom policy data. Observability hooks receive stable server trace events;
sink failures do not replace the application response.

## Production Rules

1. Keep routes and actions with the layer that owns their services.
2. Validate untrusted request data at the handler boundary.
3. Return structured domain errors instead of parsing error strings.
4. Use scoped action clients when names repeat across domains.
5. Generate clients from manifests rather than duplicating fetch paths.
6. Treat file routes as layer inputs and inspect manifest diagnostics in CI.
7. Keep uploads, persistence, authentication, and telemetry behind services.

## Next Steps

- [Migrating Layer Access](/docs/migrating-layer-access)
- [Props](/docs/props)
- [Why Effuse](/docs/why-effuse)
