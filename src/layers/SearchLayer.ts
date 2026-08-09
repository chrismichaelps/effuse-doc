import { defineLayer } from '@effuse/core';
import { searchStore } from '../store/searchStore';
import { getErrorMessage } from '../utils/errors.js';

export const SearchLayer = defineLayer({
  name: 'search',
  dependencies: [],
  store: searchStore,
  deriveProps: () => ({
    modalState: searchStore.modalState,
    query: searchStore.query,
    searchStatus: searchStore.searchStatus,
    selectedIndex: searchStore.selectedIndex,
  }),
  services: {
    search: () => searchStore,
  },
  onError: (err: unknown) => {
    console.error('[SearchLayer] error:', getErrorMessage(err));
  },
  setup: () => searchStore.init(),
});
