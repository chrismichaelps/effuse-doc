import { defineLayer, signal, computed } from '@effuse/core';
import { docsStore } from '../store/docsUIStore';
import { Sidebar } from '../components/docs/Sidebar';
import { SidebarToggle } from '../components/docs/SidebarToggle';

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
  components: {
    Sidebar,
    SidebarToggle,
  },
  services: {
    docsUI: () => docsStore,
  },
});
