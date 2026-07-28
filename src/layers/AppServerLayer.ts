import { defineLayer, fromServerFiles } from '@effuse/core';
import type { ServerActionFileModule, ServerApiFileModule } from '@effuse/core';

/**
 * Adapts the file-derived endpoints under `src/server/api` and
 * `src/server/actions` into the layer server model. A route's URL is its file
 * path; a declared path that disagrees is reported during discovery.
 */
const serverFiles = import.meta.glob<
  ServerApiFileModule | ServerActionFileModule
>(['/src/server/api/**/route.ts', '/src/server/actions/**/*.ts'], {
  eager: true,
});

export const AppServerLayer = defineLayer({
  name: 'app-server',
  server: fromServerFiles(serverFiles),
});
