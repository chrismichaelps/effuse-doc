---
title: Why Effuse
---

# Why Effuse

Effuse exists for teams that want frontend code to feel small at the component
edge while keeping application capabilities explicit, typed, and testable.

React gives broad ecosystem reach. Vue gives approachable component ergonomics.
Solid gives fine-grained reactivity. Next gives server-side application
primitives. Effuse should earn its place by combining the useful parts of those
ideas around one contract: layers define application capabilities, components
consume those capabilities with local names, and server routes/actions live next
to the services that own them.

## The Gap

Most frameworks split an app across too many disconnected surfaces:

| Need            | Common friction                                                |
| --------------- | -------------------------------------------------------------- |
| Shared services | Global modules, context trees, or untyped injection            |
| Server APIs     | Separate route files that drift from the service layer         |
| Component logic | Hook/import sprawl and implicit runtime dependencies           |
| Reactivity      | Coarse rerenders or compiler magic with unclear boundaries     |
| Testing         | Business capability and UI code tested through different seams |

Effuse should make those boundaries explicit without making component code
heavy.

## The Effuse Contract

1. Layers own capabilities.
2. Components and hooks import capabilities locally through `layers`.
3. Services are typed from the layer definition.
4. Server routes/actions are declared on the layer that owns the data.
5. Fine-grained signals update only the dependent UI.

```tsx
const AuthLayer = defineLayer({
  name: 'platformAuth',
  services: {
    auth: () => ({
      currentUser: () => ({ id: 'u1', name: 'Chris' }),
    }),
  },
  server: {
    api: {
      '/api/me': ({ services }) => services.auth.currentUser(),
    },
    actions: {
      refreshSession: ({ services }) => services.auth.currentUser(),
    },
  },
});

const ProfileButton = define({
  layers: { auth: AuthLayer } as const,
  script({ layers: { auth } }) {
    const user = auth.services.auth.currentUser();
    return { user };
  },
  template: ({ user }) => <button>{user.name}</button>,
});
```

The layer name can stay globally unique (`platformAuth`) while the component
gets the local name it wants (`auth`). That keeps the app graph stable and the
component syntax readable.

## What Makes It Worth Using

- Capability-first architecture: auth, data, analytics, feature flags, and API
  routes become explicit app modules instead of hidden imports.
- Better component DX: `define({ script, template })` keeps logic and UI close,
  while `layers: { auth: AuthLayer }` avoids string lookups and prop drilling.
- Typed service access: `auth.services.auth` is inferred from `defineLayer`;
  the component does not manually restate service types.
- Server-side power: layer-owned `server.api` and `server.actions` give Effuse a
  Next-like request surface without separating routes from the capability that
  implements them.
- Fine-grained updates: signals make state changes precise instead of forcing a
  component subtree to rerender by default.
- Production testability: layer services, component scripts, and server routes
  can be tested independently or together through the same declared layer graph.

## Non-Goals

- Effuse should not copy every framework feature by volume.
- Effuse should not hide application dependencies behind ambient globals.
- Effuse should not require component authors to know a layer's internal global
  name when a local alias is clearer.
- Effuse should not make server routes a separate system from app capabilities.

The goal is a smaller surface that composes into a more powerful application
model.
