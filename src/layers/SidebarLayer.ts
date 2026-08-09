import { defineLayer, signal, computed } from '@effuse/core';
import { docsStore } from '../store/docsUIStore.js';

export const SidebarLayer = defineLayer({
  name: 'sidebar',
  dependencies: ['layout', 'i18n'],
  store: docsStore,
  deriveProps: () => ({
    isOpen: computed(() => docsStore.isSidebarVisible()),
    width: signal(280),
    isCollapsed: computed(() => docsStore.isSidebarCollapsed()),
  }),
  services: {
    docsUI: () => docsStore,
  },
});
