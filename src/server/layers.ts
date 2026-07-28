import { AppServerLayer } from '../layers/AppServerLayer';
import { clientLayers } from '../layers/client-layers';

/**
 * The client graph plus the file-derived endpoints.
 *
 * AppServerLayer eagerly imports every module under src/server/api, so it must
 * stay out of the client graph.
 */
export const serverLayers = [...clientLayers, AppServerLayer] as const;
