import {
  define,
  defineProps,
  computed,
  type ReadonlySignal,
  For,
  type Signal,
  signal,
} from '@effuse/core';
import { Link } from '@effuse/router';
import {
  animateStaggerChildren,
  applyHoverTranslate,
} from '../../utils/motion';
import { SidebarToggle } from './SidebarToggle.js';
import { SidebarVersions } from './SidebarVersions.js';
import { docsStore } from '../../store/docsUIStore.js';
import { i18nStore } from '../../store/appI18n.js';
import { NAV_SECTIONS } from '../../content/docs/nav.js';
import { SidebarLayer } from '../../layers/SidebarLayer.js';

interface NavItem {
  label: string;
  href: string;
}

interface SectionState {
  key: string;
  title: ReadonlySignal<string>;
  items: ReadonlySignal<NavItem[]>;
  isOpen: ReadonlySignal<boolean>;
  toggle: () => void;
  containerRef: Signal<HTMLElement | null>;
}

interface SidebarProps {
  currentPath?: string;
}

interface SidebarExposed {
  sectionStates: SectionState[];
  isSidebarOpen?: ReadonlySignal<boolean>;
  toggleSidebar?: () => void;
}

const ChevronIcon = define({
  props: defineProps<{ isOpen: ReadonlySignal<boolean> }>(),
  script: ({ props }) => ({
    getClass: () => `sidebar-chevron ${props.isOpen.value ? 'open' : ''}`,
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

const translate = (key: string): string =>
  (
    i18nStore.translations.value?.sidebar as Record<string, string> | undefined
  )?.[key] ?? key;

const createSectionStates = (): SectionState[] =>
  NAV_SECTIONS.map((section) => {
    const containerRef = signal<HTMLElement | null>(null);

    const toggle = (): void => {
      docsStore.toggleSection(section.key);

      const container = containerRef.value;
      if (!container) return;

      if (docsStore.isSectionOpen(section.key)) {
        requestAnimationFrame(() => {
          animateStaggerChildren(container, '.sidebar-link', 0.03);
        });
      }
    };

    return {
      key: section.key,
      title: computed(() => translate(section.titleKey)),
      items: computed(() =>
        section.items.map((item) => ({
          label: translate(item.labelKey),
          href: item.href,
        }))
      ),
      isOpen: computed(() => docsStore.isSectionOpen(section.key)),
      toggle,
      containerRef,
    };
  });

export const Sidebar = define({
  props: defineProps<SidebarProps>(),
  layers: { sidebar: SidebarLayer } as const,
  script: ({ onMount, layers: { sidebar } }) => {
    onMount(() => {
      requestAnimationFrame(() => {
        const links = document.querySelectorAll('.sidebar-link');
        links.forEach((link) => {
          applyHoverTranslate(link as HTMLElement, 4);
        });
      });
      return undefined;
    });

    return {
      sectionStates: createSectionStates(),
      isSidebarOpen: sidebar.props.isOpen as ReadonlySignal<boolean>,
      toggleSidebar: () => {
        sidebar.props.isOpen.value = !sidebar.props.isOpen.value;
      },
    } satisfies SidebarExposed;
  },

  template: ({ sectionStates }) => (
    <aside class="docs-sidebar" data-lenis-prevent>
      <header class="sidebar-header">
        <div class="sidebar-top-row">
          <div class="flex items-center gap-2">
            <img src="/logo/logo-white.svg" width="20" height="20" alt="Logo" />
            <span class="sidebar-brand-title">Documentation</span>
          </div>
          <SidebarToggle class="sidebar-brand-toggle" />
        </div>
      </header>
      <nav class="sidebar-nav" aria-label="Documentation sidebar">
        <ul class="sidebar-sections-list list-none p-0 m-0">
          {sectionStates.map((section) => (
            <li class="sidebar-section">
              <button
                class="sidebar-section-header"
                onClick={() => section.toggle()}
                aria-expanded={section.isOpen.value}
              >
                <span class="sidebar-title">{section.title.value}</span>
                <ChevronIcon isOpen={section.isOpen} />
              </button>

              <ul
                class={() =>
                  `sidebar-items ${section.isOpen.value ? 'open' : ''} list-none p-0 m-0`
                }
                ref={(el: unknown) => {
                  section.containerRef.value = el as HTMLElement;
                }}
              >
                <For
                  each={section.items}
                  keyExtractor={(item: NavItem) => item.href}
                >
                  {(itemSignal: ReadonlySignal<NavItem>) => (
                    <li class="sidebar-item">
                      <Link
                        to={itemSignal.value.href}
                        class="sidebar-link"
                        activeClass="router-link-exact-active"
                        exactActiveClass="router-link-exact-active"
                      >
                        {itemSignal.value.label}
                      </Link>
                    </li>
                  )}
                </For>
              </ul>
            </li>
          ))}
        </ul>
      </nav>
      <SidebarVersions />
    </aside>
  ),
});
