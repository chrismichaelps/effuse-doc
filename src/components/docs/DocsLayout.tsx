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
import {
  DocsHeader,
  type TocItem,
  type TocNavigateHandler,
} from './DocsHeader.js';
import { SidebarToggle } from './SidebarToggle.js';
import {
  useScrollSpy,
  useTranslation,
  useIsMobile,
} from '../../hooks/index.js';
import { docsStore as registeredDocsStore } from '../../store/docsUIStore.js';
import { requireDocsStore } from '../../store/guards.js';
import {
  isArray,
  isNullish,
  getOrElse,
  fromNullable,
  Option,
} from '../../utils/data/index.js';
import { scrollToDocumentHeading } from './documentNavigation.js';
import './styles.css';

interface DocsLayoutProps {
  children: any;
  currentPath?: string;
  pageTitle?: string;
  tocItems?: TocItem[] | ReadonlySignal<TocItem[]>;
}

interface DocsLayoutExposed {
  docsStore: typeof registeredDocsStore;
  activeSectionId: Signal<string>;
  handleTocClick: TocNavigateHandler;
  normalizedTocItems: ReadonlySignal<TocItem[]>;
  t: (key: string, fallback?: string) => string;
  isCollapsed: ReadonlySignal<boolean>;
  isOpen: ReadonlySignal<boolean>;
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

    const docsStore = requireDocsStore(sidebar.services.docsUI);

    const normalizedTocItems = computed(() => unwrapTocItems(props.tocItems));

    const scrollSpy = useScrollSpy({
      containerSelector: '.docs-main',
      threshold: 150,
      items: normalizedTocItems,
    });

    const handleTocClick: TocNavigateHandler = (event, id) => {
      event.preventDefault();
      if (!scrollToDocumentHeading(id)) return;
      scrollSpy.setActiveId(id);
    };

    const sidebarClass = computed(() => {
      const open = docsStore.isSidebarVisible();
      const collapsed = docsStore.isSidebarCollapsed();
      const className = `sidebar-desktop-wrapper ${open ? 'sidebar-mobile-open' : 'sidebar-mobile-closed'} ${collapsed ? 'collapsed' : ''}`;
      return className;
    });

    onMount(() => {
      scrollSpy.init();
      return undefined;
    });

    return {
      docsStore,
      activeSectionId: scrollSpy.activeId,
      handleTocClick,
      normalizedTocItems,
      t,
      isCollapsed: computed(() => docsStore.isSidebarCollapsed()),
      isOpen: computed(() => docsStore.isSidebarVisible()),
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
            onNavigate={handleTocClick}
          />
        </div>
        <div class="docs-content-wrapper">
          <div class="docs-content">{children}</div>

          <aside class="docs-toc-sidebar lg:block hidden">
            <div class="toc-sidebar-container">
              <h3 class="toc-sidebar-title flex items-center gap-2">
                <img
                  src="/icons/list.svg"
                  width="14"
                  height="14"
                  alt=""
                  class="toc-sidebar-icon"
                />
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
                          onClick={(event: Event) =>
                            handleTocClick(event, itemSignal.value.id)
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
