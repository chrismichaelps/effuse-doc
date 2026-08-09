import { AppServerLayer } from '../layers/AppServerLayer';
import { clientLayers } from '../layers/client-layers';

/**
 * The client graph plus the file-derived endpoints.
 *
 * AppServerLayer consumes the generated server registry and must stay out of
 * the client graph. The registry's compatibility bridge resolves endpoint
 * modules once when the server graph starts.
 */
export const serverLayers = [...clientLayers, AppServerLayer] as const;
