import { define } from '@effuse/core';
import { searchStore } from '../../store/searchStore';
import './styles.css';

interface SearchTriggerProps {}

interface SearchTriggerExposed {
  isMac: boolean;
  handleClick: () => void;
}

export const SearchTrigger = define<SearchTriggerProps, SearchTriggerExposed>({
  script: () => {
    const isMac =
      typeof navigator !== 'undefined' &&
      navigator.platform.toLowerCase().includes('mac');

    const handleClick = () => {
      searchStore.open();
    };

    return {
      isMac,
      handleClick,
    };
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
