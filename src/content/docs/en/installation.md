---
title: Installation
---

# Installation

Effuse applications can target the browser only or ship as full-stack
applications with SSR and server APIs.

## Requirements

- Node.js 22 or later, or a current Bun release for the Bun server adapter
- pnpm 10 or later
- TypeScript 5.9 or later

## Create the package set

Install only the capabilities your application uses:

```bash
pnpm add @effuse/core @effuse/router
pnpm add @effuse/store @effuse/query @effuse/i18n @effuse/ink @effuse/use
pnpm add @effuse/server
pnpm add -D @effuse/cli @effuse/compiler typescript
```

`@effuse/server` belongs in server entry points. Do not import it from browser
components. Portable server contracts such as route definitions, middleware,
request schemas, and caches are exported by `@effuse/core`.

## Scripts

```json
{
  "scripts": {
    "dev": "effuse dev",
    "build": "effuse build",
    "typecheck": "effuse typecheck",
    "manifest": "effuse manifest"
  }
}
```

## Browser entry

```tsx
// src/main.tsx
import { createApp } from '@effuse/core';
import { installRouter } from '@effuse/router';
import { App } from './App';
import { router } from './router';

installRouter(router);
createApp(App).mount('#app');
```

```tsx
// src/App.tsx
import { define } from '@effuse/core';
import { RouterView } from '@effuse/router';

export const App = define({
  template: () => <RouterView />,
});
```

## Router

```ts
// src/router.ts
import { createRouter, createWebHistory, defineRoutes } from '@effuse/router';
import { HomePage } from './pages/Home';

const routes = defineRoutes([
  { path: '/', name: 'home', component: HomePage },
] as const);

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
```

## Full-stack entry

Add routes under `src/server/api` and use an Effuse build preset:

```bash
pnpm effuse build --preset node
# or
pnpm effuse build --preset bun
```

The CLI also accepts `vercel`, `netlify`, and `cloudflare` build presets. Check
the generated output and adapter capability matrix before deployment because
provider runtime support can differ from the Node and Bun reference adapters.

## TypeScript

Use the automatic JSX runtime:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "@effuse/core",
    "moduleResolution": "Bundler",
    "strict": true
  }
}
```

Keep browser code on `@effuse/core` or `@effuse/core/client`. Server entries may
use `@effuse/core/server` when an explicit server-only boundary is useful.
