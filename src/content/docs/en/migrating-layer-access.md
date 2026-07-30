---
title: Migrating Layer Access
---

# Migrating Layer Access

This guide moves existing applications from global string access to concrete
layer references and local aliases. Compatibility APIs remain available so the
migration can be incremental.

## Target Model

```tsx
const app = await createApp(App).useLayers([AuthLayer]);

const Profile = define({
  layers: { auth: AuthLayer } as const,
  script({ layers: { auth } }) {
    return {
      user: auth.service('auth').currentUser(),
      session: auth.prop('session'),
    };
  },
  template: ({ user }) => <p>{user?.name}</p>,
});
```

The composition root owns initialization. The component owns its local alias.
The concrete layer object carries service and prop types between them.

## 1. Rename `provides` To `services`

Before:

```ts
defineLayer({
  name: 'auth',
  provides: { auth: () => authService },
});
```

After:

```ts
export const AuthLayer = defineLayer({
  name: 'auth',
  services: { auth: () => authService },
});
```

`provides` remains a compatibility alias. Do not mix `provides` and `services`
for the same capability key.

## 2. Replace String Service Access

Before:

```ts
script({ useStore, useService }) {
  const auth = useStore('auth');
  const session = useService('session');
}
```

After:

```ts
layers: { auth: AuthLayer } as const,
script({ layers: { auth } }) {
  const authService = auth.service('auth');
  const session = auth.prop('session');
}
```

For a narrow transitional call, `useService(AuthLayer, 'auth')` preserves
concrete-layer typing without adding a local alias. Alias records remain the
preferred shape when a component consumes more than one layer member.

## 3. Replace Hook Dependencies

Before:

```ts
defineHook({
  deps: ['auth'],
  setup({ layerProvider }) {
    return layerProvider('auth');
  },
});
```

After:

```ts
defineHook({
  layers: { auth: AuthLayer } as const,
  setup({ layers: { auth } }) {
    return auth.service('auth');
  },
});
```

Hooks and components now have the same dependency vocabulary and missing-layer
diagnostics.

## 4. Remove Registry Augmentation

Delete `EffuseLayerRegistry` declarations after all consumers infer their
contract from concrete layer objects. Keep augmentation only while an unmigrated
string call still needs it.

## 5. Move Server Work Into Owning Layers

Move disconnected handlers into `server.api` or `server.actions`, or adapt
existing files with `fromServerFiles`. Server handlers then infer the same
services used by components and appear in `createLayerServerManifest`.

## 6. Verify The Composition Root

Every declared consumer layer must be registered before client mount or server
request handling. Run nested and lazy routes during migration; Effuse reports
the component or hook name, alias, concrete layer, and registration fix when a
binding is missing.

## Migration Checklist

- [ ] Each domain exports one concrete layer object.
- [ ] New service declarations use `services`.
- [ ] Components and hooks use alias records.
- [ ] String `useStore`, `useService`, and layer prop calls are removed.
- [ ] Registry augmentation is deleted when no longer needed.
- [ ] Server APIs/actions are owned by layers or adapted into them.
- [ ] The same layer graph is passed to client, SSR, handler, and manifest setup.
- [ ] Typecheck, focused tests, and lazy-route integration probes pass.

## Next Steps

- [Props](/docs/props)
- [Why Effuse](/docs/why-effuse)
- [Getting Started with Effuse](/docs/getting-started)
