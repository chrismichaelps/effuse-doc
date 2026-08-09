import {
  define,
  computed,
  watchEffect,
  For,
  Portal,
  type Signal,
  type ReadonlySignal,
} from '@effuse/core';
import { useRouter } from '@effuse/router';
import type { SearchResultItem, SearchStatus } from '../../store/searchStore';
import { requireI18nStore, requireSearchStore } from '../../store/guards.js';
import { matchTag } from '../../utils/data/index.js';
import { splitSearchHighlight } from '../../content/search/highlight.js';
import './styles.css';
import { SearchLayer } from '../../layers/SearchLayer.js';
import { scheduleDocumentHeadingScroll } from '../docs/documentNavigation.js';

interface SearchModalExposed {
  modalState: Signal<any>;
  searchStatus: Signal<SearchStatus>;
  query: Signal<string>;
  results: ReadonlySignal<SearchResultItem[]>;
  isLoading: ReadonlySignal<boolean>;
  selectedIndex: Signal<number>;
  showLoading: ReadonlySignal<boolean>;
  showError: ReadonlySignal<boolean>;
  errorMessage: ReadonlySignal<string>;
  showNoResults: ReadonlySignal<boolean>;
  showEmptyState: ReadonlySignal<boolean>;
  showResults: ReadonlySignal<boolean>;
  isOpen: ReadonlySignal<boolean>;
  isClosing: ReadonlySignal<boolean>;
  handleInput: (e: Event) => void;
  handleBackdropClick: (e: MouseEvent) => void;
  handleResultClick: (result: SearchResultItem) => void;
  handleAnimationEnd: () => void;
  highlight: (text: string) => any;
  t: ReadonlySignal<any>;
}

export const SearchModal = define({
  layers: { search: SearchLayer } as const,
  script: ({ onMount, useStore, layers: { search } }) => {
    const store = requireSearchStore(search.services.search);

    const router = useRouter();
    const i18nStore = requireI18nStore(useStore('i18n'));
    const t = computed(() => i18nStore.translations.value?.search);
    let cancelPendingAnchorNavigation: (() => void) | undefined;

    const handleInput = (e: Event) => {
      const target = e.currentTarget;
      if (!(target instanceof HTMLInputElement)) return;
      store.search(target.value);
    };

    const navigateToResult = (result: SearchResultItem): void => {
      if (!result.filePath) return;

      const slug = result.filePath.split('/').pop()?.replace('.md', '') ?? '';
      if (!slug) return;

      store.close();
      const pathname = `/docs/${slug}`;
      router.push(`${pathname}${result.anchor ? `#${result.anchor}` : ''}`);

      // A later selection owns anchor delivery and cancels pending work from
      // the previous route.
      cancelPendingAnchorNavigation?.();
      cancelPendingAnchorNavigation = result.anchor
        ? scheduleDocumentHeadingScroll(result.anchor, 30, pathname)
        : undefined;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const isOpen = matchTag(store.modalState.value, {
        Closed: () => false,
        Opening: () => true,
        Open: () => true,
        Closing: () => true,
        _: () => false,
      });
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          store.selectNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          store.selectPrevious();
          break;
        case 'Enter': {
          e.preventDefault();
          const selected = store.getSelected();
          if (selected) navigateToResult(selected);
          break;
        }
      }
    };

    const handleBackdropClick = (e: MouseEvent) => {
      const target = e.target;
      if (
        target instanceof HTMLElement &&
        target.classList.contains('search-modal-backdrop')
      ) {
        store.close();
      }
    };

    const handleResultClick = (result: SearchResultItem) =>
      navigateToResult(result);

    onMount(() => {
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        window.removeEventListener('keydown', handleKeyDown);
        cancelPendingAnchorNavigation?.();
        document.body.style.overflow = '';
      };
    });

    watchEffect(() => {
      if (typeof document === 'undefined') return;

      const isOpen = matchTag(store.modalState.value, {
        Closed: () => false,
        Opening: () => true,
        Open: () => true,
        Closing: () => true,
        _: () => false,
      });
      if (isOpen) {
        document.body.style.overflow = 'hidden';
        window.__lenis?.stop();
      } else {
        document.body.style.overflow = '';
        window.__lenis?.start();
      }
    });

    watchEffect(() => {
      if (typeof document === 'undefined') return;

      const idx = store.selectedIndex.value;
      if (idx !== undefined && idx >= 0) {
        const element = document.querySelector(
          `.search-result-item:nth-child(${idx + 1})`
        );
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }
    });

    const isOpen = computed(() =>
      matchTag(store.modalState.value, {
        Closed: () => false,
        Opening: () => true,
        Open: () => true,
        Closing: () => true,
        _: () => false,
      })
    );

    const isClosing = computed(() =>
      matchTag(store.modalState.value, {
        Closing: () => true,
        Closed: () => false,
        Opening: () => false,
        Open: () => false,
        _: () => false,
      })
    );

    const handleAnimationEnd = () => {
      if (isClosing.value) {
        store.completeClose();
      }
    };

    const results = computed<SearchResultItem[]>(() =>
      matchTag<SearchStatus, SearchResultItem[]>(store.searchStatus.value, {
        Idle: () => [],
        Loading: () => [],
        Results: ({ results }) => [...results],
        Error: () => [],
        _: () => [],
      })
    );

    const isLoading = computed(() =>
      matchTag(store.searchStatus.value, {
        Idle: () => false,
        Loading: () => true,
        Results: () => false,
        Error: () => false,
        _: () => false,
      })
    );

    const showLoading = computed(
      () => store.searchStatus.value._tag === 'Loading'
    );
    const showError = computed(() => store.searchStatus.value._tag === 'Error');
    const errorMessage = computed(() => {
      const status = store.searchStatus.value;
      if (status?._tag !== 'Error') return '';

      return status.error._tag === 'QueryTooShort'
        ? `Enter at least ${status.error.minLength} characters`
        : status.error.message;
    });
    const showNoResults = computed(() => {
      const status = store.searchStatus.value;
      return status?._tag === 'Results' && status.results.length === 0;
    });
    const showEmptyState = computed(
      () => store.searchStatus.value._tag === 'Idle'
    );
    const showResults = computed(() => {
      const status = store.searchStatus.value;
      return status?._tag === 'Results' && status.results.length > 0;
    });

    return {
      modalState: store.modalState,
      searchStatus: store.searchStatus,
      query: store.query,
      results,
      isLoading,
      selectedIndex: store.selectedIndex,
      showLoading,
      showError,
      errorMessage,
      showNoResults,
      showEmptyState,
      showResults,
      isOpen,
      isClosing,
      handleInput,
      handleBackdropClick,
      handleResultClick,
      handleAnimationEnd,
      t,
      highlight: (text: string) => {
        if (!store.query.value) return <span>{text}</span>;
        const parts = splitSearchHighlight(text, store.query.value);
        return (
          <span>
            {parts.map((part) =>
              part.toLowerCase() === store.query.value.toLowerCase() ? (
                <mark class="search-highlight">{part}</mark>
              ) : (
                part
              )
            )}
          </span>
        );
      },
    } satisfies SearchModalExposed;
  },
  template: ({
    query,
    results,
    selectedIndex,
    handleInput,
    handleBackdropClick,
    handleResultClick,
    showLoading,
    showError,
    errorMessage,
    showNoResults,
    showEmptyState,
    showResults,
    t,
    highlight,
    isOpen,
    isClosing,
    handleAnimationEnd,
  }) => (
    <Portal target="body" priority="overlay" key="search-modal">
      <div
        class={() =>
          `search-modal-backdrop ${isOpen?.value ? '' : 'hidden'} ${isClosing?.value ? 'closing' : ''}`
        }
        onClick={handleBackdropClick}
        onAnimationEnd={handleAnimationEnd}
      >
        <aside
          class="search-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Search Documentation"
        >
          <div class="search-input-wrapper">
            <img src="/icons/search.svg" alt="" class="search-icon" />
            <input
              type="text"
              class="search-input"
              placeholder={t.value?.placeholder}
              value={query}
              onInput={handleInput}
              autofocus
            />
            <kbd class="search-kbd">ESC</kbd>
          </div>

          <div class="search-results" data-lenis-prevent>
            <div class={() => (showLoading.value ? '' : 'hidden')}>
              <div class="search-loading">
                <div class="search-loading-spinner"></div>
              </div>
            </div>

            <div class={() => (showError.value ? '' : 'hidden')} role="alert">
              <div class="search-empty search-error">
                <img
                  src="/icons/search-empty.svg"
                  alt=""
                  class="search-empty-icon"
                />
                <div class="search-empty-title">Search unavailable</div>
                <div class="search-empty-subtitle">{errorMessage}</div>
              </div>
            </div>

            <div class={() => (showNoResults.value ? '' : 'hidden')}>
              <div class="search-empty">
                <img
                  src="/icons/search-empty.svg"
                  alt=""
                  class="search-empty-icon"
                />
                <div class="search-empty-title"> {t.value?.noResults}</div>
                <div class="search-empty-subtitle">{t.value?.tryDifferent}</div>
              </div>
            </div>

            <div class={() => (showEmptyState.value ? '' : 'hidden')}>
              <div class="search-empty">
                <img src="/icons/plus.svg" alt="" class="search-empty-icon" />
                <div class="search-empty-title"> {t.value?.startTyping}</div>
                <div class="search-empty-subtitle">
                  {' '}
                  {t.value?.searchAcross}
                </div>
              </div>
            </div>

            <ul
              class={() =>
                showResults.value
                  ? 'search-results-list list-none p-0 m-0'
                  : 'hidden'
              }
            >
              <For each={results} keyExtractor={(item) => item.id}>
                {(result, index) => (
                  <li
                    class={() =>
                      `search-result-item ${
                        selectedIndex?.value === index.value ? 'selected' : ''
                      }`
                    }
                    onClick={() => handleResultClick(result.value)}
                  >
                    <div class="search-result-heading">
                      {computed(
                        () => result.value.heading ?? t.value?.documentation
                      )}
                      <span class="search-result-badges">
                        {result.value.matchedIn === 'code' ? (
                          <span class="search-result-badge code">
                            {t.value?.resultCode}
                          </span>
                        ) : null}
                        {result.value.matchedIn === 'title' ? (
                          <span class="search-result-badge title">
                            {t.value?.resultTitle}
                          </span>
                        ) : null}
                        {result.value.matchedIn === 'heading' ? (
                          <span class="search-result-badge heading">
                            {t.value?.resultSection}
                          </span>
                        ) : null}
                      </span>
                    </div>
                    {result.value.matchedIn === 'code' ? (
                      result.value.code ? (
                        <div class="search-code-preview">
                          <div class="search-code-meta">
                            <span class="search-code-language">
                              {result.value.code.language ?? 'code'}
                            </span>
                            {result.value.code.section ? (
                              <span class="search-code-section">
                                {result.value.code.section}
                              </span>
                            ) : null}
                            {result.value.code.additionalMatches > 0 ? (
                              <span class="search-code-count">
                                +{result.value.code.additionalMatches} blocks
                              </span>
                            ) : null}
                          </div>
                          <pre
                            class="search-result-code"
                            aria-label="Code preview"
                          >
                            <code>
                              {result.value.code.truncatedBefore ? (
                                <span class="search-code-ellipsis">…</span>
                              ) : null}
                              {result.value.code.lines.map(
                                (line, lineIndex) => (
                                  <span class="search-code-line">
                                    <span
                                      class="search-code-line-number"
                                      aria-hidden="true"
                                    >
                                      {result.value.code!.startLine + lineIndex}
                                    </span>
                                    <span class="search-code-line-content">
                                      {highlight(line)}
                                    </span>
                                  </span>
                                )
                              )}
                              {result.value.code.truncatedAfter ? (
                                <span class="search-code-ellipsis">…</span>
                              ) : null}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <pre class="search-result-text code-match">
                          {computed(() => highlight(result.value.text))}
                        </pre>
                      )
                    ) : (
                      <div class="search-result-text">
                        {computed(() => highlight(result.value.text))}
                      </div>
                    )}
                  </li>
                )}
              </For>
            </ul>
          </div>

          <footer class="search-footer">
            <div class="search-footer-actions">
              <span class="search-footer-action">
                <kbd>↑</kbd>
                <kbd>↓</kbd>
                {t.value?.toNavigate}
              </span>
              <span class="search-footer-action">
                <kbd>↵</kbd>
                {t.value?.toSelect}
              </span>
            </div>
            <div class="search-footer-powered">
              <span>{t.value?.poweredByPrefix}</span>
              <img
                src="/logo/logo-white.svg"
                alt="Effuse"
                class="search-footer-logo"
              />
              <span>{t.value?.poweredBySuffix}</span>
            </div>
          </footer>
        </aside>
      </div>
    </Portal>
  ),
});
