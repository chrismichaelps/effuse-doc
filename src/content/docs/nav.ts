/**
 * The documentation navigation index.
 *
 * `titleKey` and `labelKey` are translation keys under `sidebar.`, not
 * translated strings. Section `key` values are what `docsUIStore` persists
 * expansion state under and must not change without migrating that state.
 */

export interface NavItem {
  /** Translation key under `sidebar.` */
  readonly labelKey: string;
  readonly href: string;
}

export interface NavSection {
  /** Stable identity, also the key `docsUIStore` stores expansion state under. */
  readonly key: string;
  /** Translation key under `sidebar.` */
  readonly titleKey: string;
  readonly items: readonly NavItem[];
  /** Whether the section starts expanded. */
  readonly defaultOpen: boolean;
}

export const NAV_SECTIONS: readonly NavSection[] = [
  {
    key: 'Getting Started',
    titleKey: 'gettingStarted',
    defaultOpen: true,
    items: [
      { labelKey: 'whyEffuse', href: '/docs/why-effuse' },
      { labelKey: 'introduction', href: '/docs/getting-started' },
      { labelKey: 'installation', href: '/docs/installation' },
      { labelKey: 'quickStart', href: '/docs/quick-start' },
      { labelKey: 'releases', href: '/releases' },
    ],
  },
  {
    key: 'Core Concepts',
    titleKey: 'coreConceptsTitle',
    defaultOpen: true,
    items: [
      { labelKey: 'components', href: '/docs/components' },
      { labelKey: 'reactivity', href: '/docs/signals' },
      { labelKey: 'hooks', href: '/docs/hooks' },
      { labelKey: 'layers', href: '/docs/layers' },
      { labelKey: 'lifecycle', href: '/docs/effects' },
      { labelKey: 'form', href: '/docs/use-form' },
      { labelKey: 'events', href: '/docs/emit' },
      { labelKey: 'context', href: '/docs/context' },
      { labelKey: 'errorHandling', href: '/docs/tagged-errors' },
      { labelKey: 'refs', href: '/docs/refs' },
      { labelKey: 'query', href: '/docs/query' },
      { labelKey: 'ink', href: '/docs/ink' },
    ],
  },
  {
    key: 'Advanced',
    titleKey: 'advancedTitle',
    defaultOpen: false,
    items: [
      { labelKey: 'routing', href: '/docs/routing' },
      { labelKey: 'server', href: '/docs/server' },
      { labelKey: 'cli', href: '/docs/cli' },
      { labelKey: 'utilityHooks', href: '/docs/utility-hooks' },
      { labelKey: 'stateManagement', href: '/docs/state' },
      { labelKey: 'seoHead', href: '/docs/seo' },
      { labelKey: 'internationalization', href: '/docs/i18n' },
      { labelKey: 'serverApis', href: '/docs/server-apis' },
      { labelKey: 'migratingLayerAccess', href: '/docs/migrating-layer-access' },
    ],
  },
  {
    key: 'Examples',
    titleKey: 'examplesTitle',
    defaultOpen: false,
    items: [
      { labelKey: 'controlFlow', href: '/components' },
      { labelKey: 'context', href: '/context' },
      { labelKey: 'form', href: '/form' },
      { labelKey: 'todos', href: '/todos' },
      { labelKey: 'props', href: '/props' },
      { labelKey: 'i18n', href: '/i18n' },
      { labelKey: 'emit', href: '/emit' },
      { labelKey: 'refs', href: '/refs' },
    ],
  },
];

/** Doc slugs the navigation actually links to, for the orphan diagnostic. */
export const navigatedSlugs = (): readonly string[] =>
  NAV_SECTIONS.flatMap((section) => section.items)
    .map((item) => item.href)
    .filter((href) => href.startsWith('/docs/'))
    .map((href) => href.slice('/docs/'.length));
