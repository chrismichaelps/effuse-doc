---
title: CLI & Builds
---

# CLI & Builds

`@effuse/cli` owns the development, type-checking, manifest, and production
build pipeline.

## Commands

```bash
pnpm effuse dev --port 5173 --host 127.0.0.1
pnpm effuse typecheck
pnpm effuse build --preset node
pnpm effuse manifest
```

| Command            | Purpose                                                  |
| ------------------ | -------------------------------------------------------- |
| `effuse dev`       | HMR, SSR, and watched server route/middleware registries |
| `effuse typecheck` | Application TypeScript validation                        |
| `effuse build`     | Client and server production output                      |
| `effuse manifest`  | Inspect routes/actions or generate a typed client module |

## Build presets

The production builder accepts `node`, `bun`, `vercel`, `netlify`, and
`cloudflare`. Use `--client-only` only when the application intentionally has no
SSR, API routes, actions, or server middleware.

```bash
pnpm effuse build --preset bun
pnpm effuse build --preset cloudflare
pnpm effuse build --client-only
```

## Generated server registry

During development the CLI watches `src/server/api`, `src/server/actions`, and
server middleware files. Changes regenerate a lazy import registry without
pulling server modules into the browser bundle. Production builds preserve the
same route signatures and report collisions or handler/file path drift.

## Typed manifest client

```bash
pnpm effuse manifest \
  --client-out src/generated/server-client.ts \
  --client-factory createServerClient
```

Generated code should be committed only when the team intentionally reviews
manifest changes in source control. Otherwise generate it during build and
verify that the workspace is clean afterward.

## CI gate

```bash
pnpm install --frozen-lockfile
pnpm effuse typecheck
pnpm effuse build --preset node
```

Run application tests before the build and exercise the generated server fetch
handler in process. A successful client-only build is not evidence that server
routes, middleware, or adapters are valid.
