import { computed, define, useHead, watchEffect } from '@effuse/core';
import type { ReadonlySignal } from '@effuse/core';
import { Ink } from '@effuse/ink';
import { useRoute } from '@effuse/router';
import { DocsLayout } from '../../components/docs/DocsLayout.js';
import type { TocItem } from '../../components/docs/DocsHeader.js';
import { i18nStore } from '../../store/appI18n.js';
import { DEFAULT_SLUG } from '../../content/docs/constants.js';
import { useDocument } from '../../domains/docs/hooks/useDocument.js';

const SITE_URL = 'https://effuse-doc.vercel.app';

interface DocsPageExposed {
  content: ReadonlySignal<string>;
  pageTitle: ReadonlySignal<string>;
  tocItems: ReadonlySignal<TocItem[]>;
  currentPath: ReadonlySignal<string>;
}

/** `[[...slug]]` yields an array, a string, or nothing for a bare `/docs`. */
const toSlug = (value: unknown): string => {
  if (Array.isArray(value)) return value.join('/') || DEFAULT_SLUG;
  if (typeof value === 'string' && value.length > 0) return value;
  return DEFAULT_SLUG;
};

export const DocsPage = define<Record<string, never>, DocsPageExposed>({
  name: 'DocsPage',
  script: () => {
    const route = useRoute();

    const slug = computed(() => toSlug(route.params.slug));
    const locale = computed(() => i18nStore.locale.value);

    const { doc } = useDocument({ locale, slug });
    const content = computed(() => doc.value?.content ?? '');
    const pageTitle = computed(() => doc.value?.title ?? '');
    // TOC ids use Ink's heading grammar and slug contract, matching the ids
    // assigned when the document is rendered.
    const tocItems = computed<TocItem[]>(() =>
      (doc.value?.toc ?? []).map((entry) => ({ ...entry }))
    );
    const currentPath = computed(() => `/docs/${slug.value}`);

    watchEffect(() => {
      const title = pageTitle.value;
      if (!title) return;

      useHead({
        title: `${title} - Effuse Docs`,
        description: `Learn about ${title} in Effuse. Detailed guide and examples for ${title.toLowerCase()} in the Effuse framework.`,
        og: {
          title: `${title} - Effuse Docs`,
          description: `Documentation for ${title} in the Effuse framework.`,
          type: 'article',
          url: `${SITE_URL}/docs/${slug.value}`,
          siteName: 'Effuse',
        },
        twitter: {
          card: 'summary',
          title: `${title} - Effuse Docs`,
          description: `Documentation for ${title} in the Effuse framework.`,
        },
      });
    });

    return { content, pageTitle, tocItems, currentPath };
  },
  template: ({ content, pageTitle, tocItems, currentPath }) => (
    <DocsLayout
      currentPath={currentPath.value}
      pageTitle={pageTitle.value}
      tocItems={tocItems}
    >
      <article
        class="prose prose-slate max-w-none"
        data-document-path={currentPath.value}
      >
        <Ink content={content} />
      </article>
    </DocsLayout>
  ),
});
