import {
  define,
  computed,
  watchEffect,
  useHead,
  type ReadonlySignal,
} from '@effuse/core';
import { useRoute } from '@effuse/router';
import { Ink } from '@effuse/ink';
import { DocsLayout } from '../../components/docs/DocsLayout.js';
import { currentDocsRegistry, docsRegistry } from '../../content/docs/index.js';
import type { TocItem } from '../../components/docs/DocsHeader.js';

interface DocsPageExposed {
  content: ReadonlySignal<string>;
  currentSlug: ReadonlySignal<string>;
  pageTitle: ReadonlySignal<string>;
  tocItems: ReadonlySignal<TocItem[]>;
}

const extractTocItems = (markdown: string): TocItem[] => {
  if (!markdown) return [];
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const items: TocItem[] = [];
  const usedIds = new Set<string>();
  let match;

  while ((match = headingRegex.exec(markdown)) !== null) {
    const level = match[1].length;
    const title = match[2].trim();

    let id = title
      .toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[^\p{L}\p{N}\-]/gu, '') // Keep Unicode letters, numbers, hyphens
      .replace(/-+/g, '-') // Collapse multiple hyphens
      .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens

    if (!id) {
      id = 'section';
    }

    const originalId = id;
    let counter = 1;
    while (usedIds.has(id)) {
      id = `${originalId}-${counter}`;
      counter++;
    }
    usedIds.add(id);

    items.push({ id, title, level });
  }
  return items;
};

export const DocsPage = define<{}, DocsPageExposed>({
  script: () => {
    const route = useRoute();

    const currentSlug = computed(() => {
      const path = route.path;
      const match = path.match(/\/docs\/(.+)/);
      return match ? match[1] : 'getting-started';
    });

    const content = computed(() => {
      const registry = currentDocsRegistry.value;
      const slug = currentSlug.value;
      const doc =
        registry[slug] ?? docsRegistry[slug] ?? docsRegistry['getting-started'];
      return doc ? doc.content : '';
    });

    const pageTitle = computed(() => {
      const registry = currentDocsRegistry.value;
      const slug = currentSlug.value;
      const doc =
        registry[slug] ?? docsRegistry[slug] ?? docsRegistry['getting-started'];
      return doc ? doc.title : 'Documentation';
    });

    watchEffect(() => {
      useHead({
        title: `${pageTitle.value} - Effuse Docs`,
        description: `Learn about ${pageTitle.value} in Effuse. Detailed guide and examples for ${pageTitle.value.toLowerCase()} in the Effuse framework.`,
        og: {
          title: `${pageTitle.value} - Effuse Docs`,
          description: `Documentation for ${pageTitle.value} in the Effuse framework.`,
          type: 'article',
          url: `https://effuse-doc.vercel.app/docs/${currentSlug.value}`,
          siteName: 'Effuse',
        },
        twitter: {
          card: 'summary',
          title: `${pageTitle.value} - Effuse Docs`,
          description: `Documentation for ${pageTitle.value} in the Effuse framework.`,
        },
      });
    });

    const tocItems = computed(() => {
      return extractTocItems(content.value);
    });

    return { content, currentSlug, pageTitle, tocItems };
  },
  template: ({ content, currentSlug, pageTitle, tocItems }) => (
    <DocsLayout
      currentPath={`/docs/${currentSlug.value}`}
      pageTitle={pageTitle.value}
      tocItems={tocItems}
    >
      <article class="prose prose-slate max-w-none">
        <Ink content={content} />
      </article>
    </DocsLayout>
  ),
});
