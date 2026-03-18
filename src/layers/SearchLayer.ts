import { defineLayer } from '@effuse/core';
import { searchStore } from '../store/searchStore';
import { SearchModal } from '../components/SearchModal';
import { SearchTrigger } from '../components/SearchTrigger';

export const SearchLayer = defineLayer({
  name: 'search',
  dependencies: [],
  store: searchStore,
  deriveProps: (store) => {
    const s = store as typeof searchStore;
    return {
      modalState: s.modalState,
      query: s.query,
      searchStatus: s.searchStatus,
      selectedIndex: s.selectedIndex,
    };
  },
  provides: {
    search: () => searchStore,
  },
  components: {
    SearchModal,
    SearchTrigger,
  },
  onMount: () => {
    console.log('[SearchLayer] mounted');
  },
  onUnmount: () => {
    console.log('[SearchLayer] unmounted');
  },
  onError: (err: unknown) => {
    const message = (err as Error).message || String(err);
    console.error('[SearchLayer] error:', message);
  },
  setup: (ctx) => {
    const s = ctx.store as typeof searchStore;
    s.init();
    return () => {
      console.log('[SearchLayer] cleanup');
    };
  },
});
