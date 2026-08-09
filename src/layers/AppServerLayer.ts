import { defineLayer } from '@effuse/core';
import { fromServerFiles } from '@effuse/core/server';
import { loadServerFiles } from '../../.effuse/server-registry.ts';

/**
 * Adapts the compiled file-derived endpoint registry into the layer model.
 * Discovery validates filesystem paths and collisions before this server-only
 * module is evaluated; the generated registry retains literal route imports.
 */
const serverFiles = await loadServerFiles();

export const AppServerLayer = defineLayer({
  name: 'app-server',
  server: fromServerFiles(serverFiles),
});
