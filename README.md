<p align="center">
  <a href="https://github.com/chrismichaelps/effuse">
    <img src="./public/logo/logo.svg" alt="Effuse" width="150" />
  </a>
</p>

<h1 align="center">Effuse Documentation</h1>

<p align="center">
  The source and application for the official Effuse framework documentation.
</p>

<p align="center">
  <a href="https://github.com/chrismichaelps/effuse">Framework</a> ·
  <a href="https://github.com/chrismichaelps/effuse/wiki">Wiki</a> ·
  <a href="https://www.npmjs.com/org/effuse">npm</a>
</p>

## Purpose

This repository is the runnable reference for Effuse. It documents the public
contracts, demonstrates the framework in a real application, and validates that
published packages work together as an ecosystem.

Effuse 2.0 combines fine-grained UI reactivity with typed capability layers,
file-based server APIs, middleware, SSR, portable Node and Bun adapters, and
production utilities. The documentation intentionally keeps browser and server
entry points separate so examples can be moved into applications safely.

## Package Ecosystem

| Package            | Responsibility                                                                     |
| ------------------ | ---------------------------------------------------------------------------------- |
| `@effuse/core`     | Components, signals, layers, schemas, SSR, server routes, middleware, and caches   |
| `@effuse/compiler` | JSX/TSX compilation and reactive expression transforms                             |
| `@effuse/cli`      | Development server, production builds, deployment presets, and manifest generation |
| `@effuse/router`   | Typed client-side routing and navigation guards                                    |
| `@effuse/server`   | Portable Web Request/Response runtime with Node and Bun adapters                   |
| `@effuse/use`      | Lifecycle-safe browser, timing, storage, and async utility hooks                   |
| `@effuse/store`    | Signal-native application state                                                    |
| `@effuse/query`    | Reactive remote data, mutations, caching, and retries                              |
| `@effuse/i18n`     | Reactive internationalization and SSR-safe locale instances                        |
| `@effuse/ink`      | Safe reactive Markdown rendering with SSR support                                  |

## Development

Requirements: Node.js 22 or later and pnpm 10.

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The Vite development server prints the local URL. Documentation content lives
in `src/content/docs/<locale>`, while application examples live in `src/pages`
and `src/components`.

## Quality Gates

```bash
pnpm typecheck
pnpm format:check
pnpm build
```

Every dependency upgrade must pass all three commands and a browser smoke test
of the home page, documentation index, and newly changed routes.

## Documentation Policy

- Document shipped public APIs, not proposals.
- Prefer complete, type-inferred examples over isolated snippets.
- Import server-only APIs only from server modules.
- Use Effuse schemas (`serverSchema`, `v`) in public examples; developers do not
  need to install or learn the internal validation engine.
- Add English source documentation first. Missing localized pages intentionally
  fall back to English until a reviewed translation is available.

## Contributing

Open an issue describing the contract or documentation gap before a substantial
change. Keep examples executable, link the relevant framework package or test,
and include the validation commands in the pull request.

## License

MIT © Chris M. Pérez
