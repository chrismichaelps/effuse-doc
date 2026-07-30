---
title: Layers
---

# Layers

Layers are Effuse's typed capability boundary. A layer owns related state,
services, lifecycle, components, routes, and server behavior. Components and
hooks import that capability through a local alias, without string lookups or
prop drilling.

## Define a capability

```ts
import { defineLayer, signal } from '@effuse/core';

const mode = signal<'light' | 'dark'>('dark');

export const ThemeLayer = defineLayer({
  name: 'theme',
  deriveProps: () => ({ mode }),
  services: {
    theme: () => ({
      toggle() {
        mode.value = mode.value === 'dark' ? 'light' : 'dark';
      },
    }),
  },
  setup: () => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') mode.value = saved;
    return () => localStorage.setItem('theme', mode.value);
  },
});
```

`services` is the preferred vocabulary. `provides` remains available for
compatibility with earlier applications.

## Import layers by alias

```tsx
import { computed, define } from '@effuse/core';
import { ThemeLayer } from './ThemeLayer';

export const ThemeToggle = define({
  layers: { theme: ThemeLayer } as const,
  script: ({ layers: { theme } }) => ({
    label: computed(() =>
      theme.props.mode.value === 'dark' ? 'Use light theme' : 'Use dark theme'
    ),
    toggle: () => theme.services.theme.toggle(),
  }),
  template: ({ label, toggle }) => (
    <button onClick={toggle}>{label.value}</button>
  ),
});
```

The alias is local to the component. Renaming `theme` does not rename the
global layer, and TypeScript infers props and services directly from
`ThemeLayer`.

## Script context

The component `script` context is organized by purpose:

| Group        | Members                                                       |
| ------------ | ------------------------------------------------------------- |
| Inputs       | `props`, `layers`, `router`                                   |
| Reactivity   | `signal`, `computed`, `watch`, `watchMultiple`, `watchEffect` |
| Lifecycle    | `onBeforeMount`, `onMount`, `onBeforeUnmount`, `onUnmount`    |
| Capabilities | `useLayer`, `useService`, `useComponent`, `store`, `useStore` |
| Composition  | `provide`, `inject`, `expose`, `useCallback`, `useMemo`       |

Use `layers` as the primary path. `useLayer(ThemeLayer)` and
`useService(ThemeLayer, 'theme')` are direct escape hatches for dynamic or
library code. String-based helpers are compatibility APIs and require registry
augmentation to infer application-specific names.

## Hooks use the same grammar

```ts
import { defineHook } from '@effuse/core';
import { ThemeLayer } from './ThemeLayer';

export const useTheme = defineHook({
  name: 'useTheme',
  layers: { theme: ThemeLayer } as const,
  setup: ({ layers: { theme } }) => ({
    mode: theme.props.mode,
    toggle: () => theme.services.theme.toggle(),
  }),
});
```

Hooks and components therefore share one capability model. A hook does not need
an independent dependency registry.

## Layer-owned server behavior

A domain layer can own its API and actions beside its services:

```ts
export const UsersLayer = defineLayer({
  name: 'users',
  services: {
    users: () => userRepository,
  },
  server: {
    api: {
      '/api/users/[id]': {
        GET: ({ params, services }) => services.users.find(params.id),
      },
    },
    actions: {
      refresh: ({ services }) => services.users.refresh(),
    },
  },
});
```

Client code can call `createLayerActionClient(UsersLayer)` without manually
constructing action URLs. The generated server manifest keeps routes, actions,
middleware, cache policy, and runtime metadata synchronized.

## Lifecycle and ownership

- Declare dependencies explicitly when one capability cannot initialize alone.
- Initialize external resources in `setup` and return their cleanup function.
- Keep mutable state inside the layer or its store, not at component module
  scope unless it is intentionally process-wide.
- Use `onError` for recovery at the owning capability boundary.
- Keep server-only service implementations out of modules imported by browser
  components.

## Compatibility registry

Existing applications can continue to augment `EffuseLayerRegistry` for typed
string access:

```ts
declare module '@effuse/core' {
  interface EffuseLayerRegistry {
    theme: {
      props: { mode: Signal<'light' | 'dark'> };
      provides: { theme: ThemeService };
    };
  }
}
```

For new code, alias records are more portable and require less global type
coordination.

## Next Steps

- [Effects API](/docs/effects)
- [Form Management (useForm)](/docs/use-form)
- [Event Emission (useEmits)](/docs/emit)
