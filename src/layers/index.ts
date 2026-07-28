export { SidebarLayer } from './SidebarLayer';
export { RouterLayer } from './RouterLayer';
export { router } from '../router';
export { I18nLayer } from './I18nLayer';
export { TodosLayer } from './TodosLayer';
export { DocsLayer } from './DocsLayer';
export { LayoutLayer } from './LayoutLayer';
export { SearchLayer } from './SearchLayer';
export { AppServerLayer } from './AppServerLayer';

import { InkLayer } from '@effuse/ink';
import { RouterLayer as _RouterLayer } from './RouterLayer';
import { LayoutLayer as _LayoutLayer } from './LayoutLayer';
import { I18nLayer as _I18nLayer } from './I18nLayer';
import { SidebarLayer as _SidebarLayer } from './SidebarLayer';
import { DocsLayer as _DocsLayer } from './DocsLayer';
import { TodosLayer as _TodosLayer } from './TodosLayer';
import { SearchLayer as _SearchLayer } from './SearchLayer';
import { AppServerLayer as _AppServerLayer } from './AppServerLayer';

/** The layer graph. Shared by client mount, the SSR runtime, and the handler. */
export const appLayers = [
	InkLayer,
	_RouterLayer,
	_LayoutLayer,
	_I18nLayer,
	_SidebarLayer,
	_DocsLayer,
	_TodosLayer,
	_SearchLayer,
	_AppServerLayer,
] as const;
