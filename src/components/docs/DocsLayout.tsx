import {
  define,
  defineProps,
  type Signal,
  For,
  computed,
  type ReadonlySignal,
} from '@effuse/core';
import { SidebarLayer } from '../../layers/SidebarLayer.js';
import { Sidebar } from './Sidebar.js';
import { DocsHeader, type TocItem } from './DocsHeader.js';
import { SidebarToggle } from './SidebarToggle.js';
import {
  useScrollSpy,
  useSmoothScroll,
  useTranslation,
  useIsMobile,
} from '../../hooks/index.js';
import type { docsStore as DocsStoreType } from '../../store/docsUIStore.js';
import {
  isArray,
  isNullish,
  getOrElse,
  fromNullable,
  Option,
} from '../../utils/data/index.js';
import './styles.css';

interface DocsLayoutProps {
  children: any;
  currentPath?: string;
  pageTitle?: string;
  tocItems?: TocItem[] | ReadonlySignal<TocItem[]>;
}

interface DocsLayoutExposed {
  docsStore: typeof DocsStoreType;
  activeSectionId: Signal<string>;
  handleTocClick: (e: Event, id: string, title: string) => void;
  normalizedTocItems: ReadonlySignal<TocItem[]>;
  t: (key: string, fallback?: string) => string;
  isCollapsed: Signal<unknown>;
  isOpen: Signal<unknown>;
  sidebarClass: ReadonlySignal<string>;
  isMobile: ReadonlySignal<boolean>;
}

const unwrapTocItems = (
  items: TocItem[] | ReadonlySignal<TocItem[]> | undefined
): TocItem[] => {
  const toOption = (): Option<TocItem[]> => {
    if (isNullish(items)) return fromNullable(undefined);
    if (isArray(items)) return fromNullable(items);
    return fromNullable(items?.value);
  };

  return getOrElse(toOption(), () => []);
};

export const DocsLayout = define({
  props: defineProps<DocsLayoutProps>(),
  layers: { sidebar: SidebarLayer } as const,
  script: ({ props, onMount, layers: { sidebar } }) => {
    const { t } = useTranslation();
    const isMobile = useIsMobile();

    const docsStore = (sidebar.services.docsUI ??
      sidebar.service('docsUI')) as typeof DocsStoreType;

    const normalizedTocItems = computed(() => unwrapTocItems(props.tocItems));

    const scrollSpy = useScrollSpy({
      containerSelector: '.docs-main',
      threshold: 150,
    });

    const smoothScroll = useSmoothScroll({
      wrapper: '.docs-main',
      content: '.docs-content',
      duration: 1.2,
    });

    const handleTocClick = (e: Event, id: string, title: string) => {
      {
        e.preventDefault();
        scrollSpy.setActiveId(id);

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

        if (el) {
          const scrollContainer = document.querySelector('.docs-main');
          if (scrollContainer) {
            const rect = el.getBoundingClientRect();
            const containerRect = scrollContainer.getBoundingClientRect();
            const offsetTop =
              rect.top - containerRect.top + scrollContainer.scrollTop;
            scrollContainer.scrollTo({
              top: offsetTop - 20,
              behavior: 'smooth',
            });
          }
        }
      }
    };

    const sidebarClass = computed(() => {
      const open = sidebar.props.isOpen.value;
      const collapsed = sidebar.props.isCollapsed.value;
      const className = `sidebar-desktop-wrapper ${open ? 'sidebar-mobile-open' : 'sidebar-mobile-closed'} ${collapsed ? 'collapsed' : ''}`;
      return className;
    });

    onMount(() => {
      scrollSpy.setItems(normalizedTocItems.value);
      scrollSpy.init();
      smoothScroll.init();
      return undefined;
    });

    return {
      docsStore,
      activeSectionId: scrollSpy.activeId,
      handleTocClick,
      normalizedTocItems,
      t,
      isCollapsed: sidebar.props.isCollapsed,
      isOpen: sidebar.props.isOpen,
      sidebarClass,
      isMobile,
    } satisfies DocsLayoutExposed;
  },
  template: ({
    docsStore,
    activeSectionId,
    handleTocClick,
    normalizedTocItems,
    t,
    children,
    isCollapsed,
    isOpen,
    sidebarClass,
    isMobile,
    props,
  }) => (
    <div
      class={() =>
        `docs-layout ${isCollapsed.value ? 'sidebar-collapsed' : ''}`
      }
    >
      {computed(() =>
        isOpen.value && isMobile.value ? (
          <div
            class="fixed inset-0 bg-black/20 z-30 backdrop-blur-sm"
            onClick={docsStore.close}
          />
        ) : null
      )}

      <div class={() => sidebarClass.value}>
        <Sidebar currentPath={props.currentPath} />
      </div>

      <main class="docs-main" data-lenis-prevent>
        <SidebarToggle
          class={() =>
            `collapsed-sidebar-trigger ${isCollapsed.value ? '' : 'trigger-hidden'}`
          }
        />

        <div class="lg:hidden block">
          <DocsHeader
            pageTitle={props.pageTitle}
            tocItems={normalizedTocItems}
            activeId={activeSectionId}
          />
        </div>
        <div class="docs-content-wrapper">
          <div class="docs-content">{children}</div>

          <aside class="docs-toc-sidebar lg:block hidden">
            <div class="toc-sidebar-container">
              <h3 class="toc-sidebar-title flex items-center gap-2">
                <img src="/icons/list.svg" width="14" height="14" alt="List" />
                {t('toc.onThisPage', '')}
              </h3>
              <nav class="toc-sidebar-nav" aria-label="Table of contents">
                <ul class="toc-sidebar-list list-none p-0 m-0">
                  <For
                    each={normalizedTocItems}
                    keyExtractor={(item: TocItem) => item.id}
                  >
                    {(itemSignal: ReadonlySignal<TocItem>) => (
                      <li class="toc-sidebar-item">
                        <a
                          href={`#${itemSignal.value.id}`}
                          class={() =>
                            `toc-sidebar-link ${activeSectionId.value === itemSignal.value.id ? 'active' : ''}`
                          }
                          onClick={(e: Event) =>
                            handleTocClick(
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
          </aside>
        </div>
      </main>
    </div>
  ),
});
