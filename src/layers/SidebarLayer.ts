import { defineLayer, signal, computed } from '@effuse/core';
import { docsStore } from '../store/docsUIStore';

export const SidebarLayer = defineLayer({
  name: 'sidebar',
  dependencies: ['layout', 'i18n'],
  store: docsStore,
  deriveProps: (store) => {
    const s = store as typeof docsStore;
    return {
      isOpen: computed(() => s.isSidebarVisible()),
      width: signal(280),
      isCollapsed: computed(() => s.isSidebarCollapsed()),
    };
  },
  provides: {
    docsUI: () => docsStore,
  },
});
