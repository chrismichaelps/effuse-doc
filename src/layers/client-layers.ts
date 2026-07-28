import { InkLayer } from '@effuse/ink';
import { RouterLayer } from './RouterLayer';
import { LayoutLayer } from './LayoutLayer';
import { I18nLayer } from './I18nLayer';
import { SidebarLayer } from './SidebarLayer';
import { DocsLayer } from './DocsLayer';
import { TodosLayer } from './TodosLayer';
import { SearchLayer } from './SearchLayer';

/** Layers rendered on both client and server. */
export const clientLayers = [
  InkLayer,
  RouterLayer,
  LayoutLayer,
  I18nLayer,
  SidebarLayer,
  DocsLayer,
  TodosLayer,
  SearchLayer,
] as const;
