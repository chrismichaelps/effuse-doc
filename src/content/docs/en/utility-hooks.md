---
title: Utility Hooks
---

# Utility Hooks

`@effuse/use` provides production browser and timing utilities built on
`defineHook`. Each hook is SSR-aware, exposes signals, and registers cleanup with
the component lifecycle.

```bash
pnpm add @effuse/use
```

## Available hooks

| Hook                          | Capability                                    |
| ----------------------------- | --------------------------------------------- |
| `useWindowSize`               | Reactive viewport dimensions                  |
| `useMediaQuery`               | Reactive CSS media-query matching             |
| `usePreferredColorScheme`     | Light/dark system preference                  |
| `useOnline`                   | Browser connectivity state                    |
| `useDocumentVisibility`       | Page visibility state                         |
| `useEventListener`            | Lifecycle-safe event listeners                |
| `useLocalStorage`             | Reactive persisted values                     |
| `useClipboard`                | Permission-aware read/write and copy feedback |
| `useInterval` / `useTimeout`  | Controllable lifecycle-safe timers            |
| `useAsyncTask`                | Race-safe async execution state               |
| `useDebounce` / `useThrottle` | Rate-limited reactive values                  |

## Responsive UI

```tsx
import { define } from '@effuse/core';
import { useMediaQuery } from '@effuse/use';

export const Navigation = define({
  script: () => {
    const mobile = useMediaQuery({
      query: '(max-width: 767px)',
      initialValue: false,
    });
    return { isMobile: mobile.matches };
  },
  template: ({ isMobile }) =>
    isMobile.value ? <MobileNavigation /> : <DesktopNavigation />,
});
```

## Clipboard

```tsx
import { define } from '@effuse/core';
import { useClipboard } from '@effuse/use';

export const CopyButton = define({
  script: () => {
    const clipboard = useClipboard({ copiedResetMs: 2_000 });
    return {
      copied: clipboard.copied,
      copy: () => clipboard.copy('pnpm add @effuse/core'),
    };
  },
  template: ({ copied, copy }) => (
    <button onClick={copy}>{copied.value ? 'Copied' : 'Copy'}</button>
  ),
});
```

Clipboard operations can fail because of permissions, unavailable secure
context APIs, or an unmounted component. Inspect the returned error signal when
the interface needs to distinguish those cases.

## Async work

`useAsyncTask` tracks idle, pending, success, error, and cancellation without
letting an older request overwrite a newer result. Prefer it for component-local
commands; use `@effuse/query` for shared remote data and cache policy.

## SSR rules

- Pass an explicit initial value when server and client markup must match.
- Read browser APIs through hooks, not at module evaluation time.
- Treat online state as a hint, never proof that a request will succeed.
- Stop timers and event listeners through the hook API or component unmount.
- Handle denied permissions and unavailable APIs as normal states.

## Next Steps

- [State Management](/docs/state)
- [SEO & Head Management](/docs/seo)
- [Internationalization](/docs/i18n)
