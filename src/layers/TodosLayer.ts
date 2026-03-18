import { defineLayer, signal, computed } from '@effuse/core';
import { isTaggedError } from '../utils/data/tagged-error.js';
import { todosStore } from '../store/todosStore';

export const TodosLayer = defineLayer({
  name: 'todos',
  dependencies: ['i18n'],
  store: todosStore,
  deriveProps: (store) => {
    const s = store as typeof todosStore;
    return {
      isLoading: signal(false),
      filter: s.filter,
      totalCount: computed(() => s.todos.value.length),
    };
  },
  provides: {
    todosStore: () => todosStore,
  },
  onMount: () => {
    console.log('[TodosLayer] mounted');
  },
  onUnmount: () => {
    console.log('[TodosLayer] unmounted');
  },
  onError: (err) => {
    const message = isTaggedError(err) ? err.toString() : String(err);
    console.error('[TodosLayer] error:', message);
  },
});
