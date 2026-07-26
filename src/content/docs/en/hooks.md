---
title: Hooks
---

# Hooks

Hooks in Effuse provide reusable, composable logic with built-in lifecycle management. Create custom hooks using `defineHook` from `@effuse/core`.

For production browser and timing utilities, install `@effuse/use` and see
[Utility Hooks](/docs/utility-hooks). Keep `defineHook` for application-specific
composition and capability ownership.

## Creating a Hook

Use `defineHook` to create typed, reusable hooks:

```typescript
import { defineHook, type Signal } from '@effuse/core';

interface ToggleConfig {
  initial?: boolean;
}

interface ToggleReturn {
  isOpen: Signal<boolean>;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useToggle = defineHook<ToggleConfig, ToggleReturn>({
  name: 'useToggle',
  setup: ({ config, signal }): ToggleReturn => {
    const isOpen = signal(config.initial ?? false);

    return {
      isOpen,
      toggle: () => {
        isOpen.value = !isOpen.value;
      },
      open: () => {
        isOpen.value = true;
      },
      close: () => {
        isOpen.value = false;
      },
    };
  },
});
```

## Hook Context

The `setup` function receives a context object with these utilities:

| Property        | Description                                     |
| --------------- | ----------------------------------------------- |
| `config`        | Configuration passed when calling the hook      |
| `signal`        | Create reactive signals                         |
| `computed`      | Create derived computed values                  |
| `watchEffect`   | Run side effects that track dependencies        |
| `onMount`       | Register callbacks for when the hook is mounted |
| `layer`         | Access layer props by name                      |
| `layerProvider` | Access layer services                           |
| `scope`         | Manage cleanup and finalizers                   |

## Built-in Utility Hooks

Effuse provides several built-in hooks within the `script` context for common patterns:

### `useCallback(fn, deps?)`

Memoizes a function to maintain a stable identity across renders.

```tsx
const handleClick = useCallback(() => {
  console.log('Clicked!', count.value);
}, [count]);
```

### `useMemo(fn, deps?)`

Memoizes a computed value. Useful for expensive calculations that don't need to be reactive signals themselves but should be cached.

```tsx
const expensiveValue = useMemo(() => {
  return performHeavyCalculation(props.data);
}, [props.data]);
```

### `useStore(name)`

Access a global store by name.

```tsx
const todos = useStore('todos');
```

## Using Hooks in Components

Call hooks in your component's `script` function:

```tsx
import { define } from '@effuse/core';
import { useToggle } from '../hooks';

const Dropdown = define({
  script: ({ onMount }) => {
    const menu = useToggle({ initial: false });

    return {
      isOpen: menu.isOpen,
      toggle: menu.toggle,
    };
  },
  template: ({ isOpen, toggle }) => (
    <div>
      <button onClick={toggle}>{isOpen.value ? 'Close' : 'Open'}</button>
      {isOpen.value && <div class="menu">Menu Content</div>}
    </div>
  ),
});
```

## DOM-Dependent Hooks

For hooks that need DOM access, use a lazy initialization pattern:

```typescript
import { defineHook, type Signal } from '@effuse/core';

interface ClickOutsideConfig {
  selector: string;
}

interface ClickOutsideReturn {
  onClickOutside: (callback: () => void) => void;
  init: () => void;
}

export const useClickOutside = defineHook<
  ClickOutsideConfig,
  ClickOutsideReturn
>({
  name: 'useClickOutside',
  setup: ({ config, signal, watchEffect }): ClickOutsideReturn => {
    const initialized = signal(false);
    let callback: (() => void) | null = null;

    watchEffect(() => {
      if (!initialized.value) return undefined;

      const handleClick = (e: Event) => {
        const target = e.target as HTMLElement;
        if (!target.closest(config.selector)) {
          callback?.();
        }
      };

      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    });

    return {
      onClickOutside: (cb) => {
        callback = cb;
      },
      init: () => {
        initialized.value = true;
      },
    };
  },
});
```

Use in a component:

```tsx
const Dropdown = define({
  script: ({ onMount }) => {
    const toggle = useToggle({ initial: false });
    const clickOutside = useClickOutside({ selector: '.dropdown' });

    onMount(() => {
      clickOutside.onClickOutside(() => toggle.close());
      clickOutside.init();
      return undefined;
    });

    return { isOpen: toggle.isOpen, toggle: toggle.toggle };
  },
  template: ({ isOpen, toggle }) => (
    <div class="dropdown">
      <button onClick={toggle}>Menu</button>
      {isOpen.value && <div class="menu">Content</div>}
    </div>
  ),
});
```

## Accessing Layers from Hooks

Hooks can access layer state and services:

```typescript
import { defineHook } from '@effuse/core';

export const useTranslation = defineHook({
  name: 'useTranslation',
  layers: { i18n: I18nLayer } as const,
  setup: ({ layers: { i18n } }) => ({
    t: (key: string) => i18n.props.translations.value?.[key] ?? key,
  }),
});
```

## Cleanup

Watch effects automatically clean up when the component unmounts. Return a cleanup function from `watchEffect`:

```typescript
watchEffect(() => {
  const handler = () => {
    /* ... */
  };
  window.addEventListener('resize', handler);

  // Cleanup runs when the watcher re-runs or the component unmounts
  return () => window.removeEventListener('resize', handler);
});
```
