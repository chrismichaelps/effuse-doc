import {
  define,
  defineProps,
  computed,
  signal,
  type Signal,
  type ReadonlySignal,
  For,
} from '@effuse/core';
import {
  animateDropdownOpen,
  animateDropdownClose,
  animateStaggerChildren,
} from '../../utils/motion';
import { useAnimatedDropdown, useTranslation } from '../../hooks/index.js';
import { SidebarLayer } from '../../layers/SidebarLayer.js';
import { SidebarToggle } from './SidebarToggle.js';

export interface TocItem {
  id: string;
  title: string;
  level?: number;
}

interface DocsHeaderProps {
  pageTitle?: string;
  tocItems?: TocItem[] | ReadonlySignal<TocItem[]>;
  activeId?: Signal<string>;
  class?: string;
}

interface DocsHeaderExposed {
  resolvedPageTitle: ReadonlySignal<string>;
  normalizedTocItems: ReadonlySignal<TocItem[]>;
  dropdownOpen: Signal<boolean>;
  toggleDropdown: () => void;
  activeSectionId: Signal<string>;
  activeSectionTitle: ReadonlySignal<string>;
  handleTocItemClick: (e: Event, id: string, title: string) => void;
  onThisPageText: ReadonlySignal<string>;
  dropdownRef: Signal<HTMLElement | null>;
}

const TocChevron = define({
  props: defineProps<{ isOpen: Signal<boolean> }>(),
  script: ({ props }) => ({
    getClass: () => `toc-chevron ${props.isOpen.value ? 'open' : ''}`,
  }),
  template: ({ getClass }) => (
    <img
      src="/icons/chevron-down.svg"
      class={getClass}
      width="16"
      height="16"
      alt="Chevron"
    />
  ),
});

export const DocsHeader = define({
  props: defineProps<DocsHeaderProps>(),
  layers: { sidebar: SidebarLayer } as const,
  script: ({ props, onMount }) => {
    const { t } = useTranslation();

    const resolvedPageTitle = computed(() => props.pageTitle as string);

    const normalizedTocItems = computed<TocItem[]>(() => {
      const items = props.tocItems;
      if (!items) return [];
      if (Array.isArray(items)) return items;
      return items.value;
    });

    const dropdown = useAnimatedDropdown({
      animateOpen: animateDropdownOpen,
      animateClose: animateDropdownClose,
      staggerChildren: animateStaggerChildren,
      staggerSelector: '.toc-item',
      staggerDelay: 0.03,
    });

    onMount(() => {
      dropdown.init();
      return undefined;
    });

    const activeSectionId = props.activeId ?? signal('');

    const activeSectionTitle = computed(() => {
      const items = normalizedTocItems.value;
      const activeId = activeSectionId.value;
      const found = items.find((item) => item.id === activeId);
      return found ? found.title : resolvedPageTitle.value;
    });

    const onThisPageText = computed(() => t('toc.onThisPage', ''));

    const handleTocItemClick = (e: Event, id: string, title: string) => {
      {
        e.preventDefault();
        dropdown.close();

        let el: HTMLElement | null = null;
        try {
          el = document.querySelector(`#${CSS.escape(id)}`);
        } catch {
          el = document.getElementById(id);
        }

        if (!el) {
          const headings = document.querySelectorAll('h1, h2, h3');
          for (const h of headings) {
            if (h.textContent?.trim() === title) {
              el = h as HTMLElement;
              break;
            }
          }
        }

        if (!el) return;

        const scrollContainer = document.querySelector('.docs-main');
        const isContainerScrollable =
          scrollContainer &&
          scrollContainer.scrollHeight > scrollContainer.clientHeight;

        if (isContainerScrollable) {
          const rect = el.getBoundingClientRect();
          const containerRect = scrollContainer.getBoundingClientRect();
          const offsetTop =
            rect.top - containerRect.top + scrollContainer.scrollTop;
          scrollContainer.scrollTo({
            top: offsetTop - 80,
            behavior: 'smooth',
          });
        } else {
          const rect = el.getBoundingClientRect();
          const scrollTop =
            window.pageYOffset || document.documentElement.scrollTop;
          window.scrollTo({
            top: rect.top + scrollTop - 100,
            behavior: 'smooth',
          });
        }
      }
    };

    return {
      resolvedPageTitle,
      normalizedTocItems,
      dropdownOpen: dropdown.isOpen,
      toggleDropdown: dropdown.toggle,
      activeSectionId,
      activeSectionTitle,
      handleTocItemClick,
      onThisPageText,
      dropdownRef: dropdown.ref,
    } satisfies DocsHeaderExposed;
  },
  template: ({
    dropdownOpen,
    toggleDropdown,
    activeSectionId,
    activeSectionTitle,
    handleTocItemClick,
    onThisPageText,
    dropdownRef,
    normalizedTocItems,
    props,
  }) => (
    <header
      class={() => `toc-nav shadow-lg ${props.class ?? ''}`}
      id="nd-tocnav"
    >
      <div class="flex items-center w-full h-full relative px-2">
        <div class="w-9 flex-shrink-0">
          <SidebarToggle class="p-1" />
        </div>

        <div class="flex-1 flex justify-center items-center overflow-hidden">
          <button
            type="button"
            class="toc-trigger"
            onClick={toggleDropdown}
            aria-expanded={dropdownOpen.value}
            aria-label="Table of contents"
          >
            <span class="toc-trigger-label">
              {() =>
                activeSectionTitle.value || props.pageTitle || 'On this page'
              }
            </span>
            <TocChevron isOpen={dropdownOpen} />
          </button>
        </div>

        <div class="w-9 flex-shrink-0" />
      </div>

      <div
        ref={(el: unknown) => {
          dropdownRef.value = el as HTMLElement;
        }}
        class="toc-popover"
        style="display: none;"
      >
        <div class="toc-header">{onThisPageText.value}</div>
        <nav class="toc-list-container max-h-[60vh] overflow-y-auto custom-scrollbar">
          <ul class="space-y-1 p-0 m-0 list-none">
            <For
              each={normalizedTocItems}
              keyExtractor={(item: TocItem) => item.id}
            >
              {(itemSignal: ReadonlySignal<TocItem>) => (
                <li
                  class={() =>
                    `toc-popover-item ${itemSignal.value.level === 3 ? 'nested' : ''}`
                  }
                >
                  <a
                    href={`#${itemSignal.value.id}`}
                    class={() =>
                      `toc-popover-link ${
                        activeSectionId.value === itemSignal.value.id
                          ? 'active'
                          : ''
                      }`
                    }
                    onClick={(e: Event) =>
                      handleTocItemClick(
                        e,
                        itemSignal.value.id,
                        itemSignal.value.title
                      )
                    }
                  >
                    {itemSignal.value.title}
                  </a>
                </li>
              )}
            </For>
          </ul>
        </nav>
      </div>
    </header>
  ),
});
