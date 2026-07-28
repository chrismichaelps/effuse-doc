import { computed, define, signal, useHead, watchEffect } from '@effuse/core';
import type { ReadonlySignal } from '@effuse/core';
import { Ink } from '@effuse/ink';
import { ensureQueryData } from '@effuse/query';
import { useRoute } from '@effuse/router';
import { DocsLayout } from '../../components/docs/DocsLayout.js';
import type { TocItem } from '../../components/docs/DocsHeader.js';
import { i18nStore } from '../../store/appI18n.js';
import { queryClient } from '../../store/queryClient.js';
import { DEFAULT_SLUG } from '../../content/docs/constants.js';
import type { Doc } from '../../content/docs/types.js';

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

    const doc = signal<Doc | undefined>(
      queryClient.getQueryData<Doc>(['docs', locale.value, slug.value])
    );

    // ensureQueryData gives the shared cache and request de-duplication while
    // leaving the key free to change with locale and slug, which useQuery's
    // static queryKey cannot express.
    watchEffect(() => {
      const currentLocale = locale.value;
      const currentSlug = slug.value;

      const cached = queryClient.getQueryData<Doc>([
        'docs',
        currentLocale,
        currentSlug,
      ]);
      if (cached && doc.value !== cached) {
        doc.value = cached;
        return;
      }

      if (typeof window === 'undefined') return;

      void ensureQueryData<Doc>(
        ['docs', currentLocale, currentSlug],
        async () => {
          const response = await fetch(
            `/api/docs/${currentLocale}/${encodeURIComponent(currentSlug)}`
          );
          if (!response.ok) {
            throw new Error(`Document not found: ${currentSlug}`);
          }
          return (await response.json()) as Doc;
        },
        { client: queryClient, staleTime: Number.POSITIVE_INFINITY }
      )
        .then((data) => {
          if (locale.value === currentLocale && slug.value === currentSlug) {
            if (doc.value !== data) {
              doc.value = data;
            }
          }
        })
        .catch(() => {
          if (locale.value === currentLocale && slug.value === currentSlug) {
            if (doc.value !== undefined) {
              doc.value = undefined;
            }
          }
        });
    });
    const content = computed(() => doc.value?.content ?? '');
    const pageTitle = computed(() => doc.value?.title ?? '');
    // The table of contents comes from the same parse that renders the
    // document, so an anchor cannot describe a heading the renderer skipped.
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
      <article class="prose prose-slate max-w-none">
        <Ink content={content} />
      </article>
    </DocsLayout>
  ),
});
