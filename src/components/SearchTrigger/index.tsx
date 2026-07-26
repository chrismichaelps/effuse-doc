import { define, defineProps } from '@effuse/core';
import type { SearchStore } from '../../store/searchStore';
import './styles.css';
import { SearchLayer } from '../../layers/SearchLayer.js';

interface SearchTriggerProps {}

interface SearchTriggerExposed {
  isMac: boolean;
  handleClick: () => void;
}

export const SearchTrigger = define({
  props: defineProps<SearchTriggerProps>(),
  layers: { search: SearchLayer } as const,
  script: ({ useCallback, layers: { search } }) => {
    const isMac =
      typeof navigator !== 'undefined' &&
      navigator.platform.toLowerCase().includes('mac');

    const store = search.services.search as SearchStore;

    const handleClick = useCallback(() => {
      store?.open();
    });

    return {
      isMac,
      handleClick,
    } satisfies SearchTriggerExposed;
  },
  template: ({ isMac, handleClick }) => (
    <button type="button" class="search-trigger" onClick={handleClick}>
      <img src="/icons/search.svg" alt="" class="search-trigger-icon" />
      <span class="search-trigger-text">Search</span>
      <span class="search-trigger-kbd">
        <kbd>{isMac ? '⌘' : 'Ctrl'}</kbd>
        <kbd>K</kbd>
      </span>
    </button>
  ),
});
