import { defineHook, type ReadonlySignal } from '@effuse/core';
import { ensureQueryData } from '@effuse/query';
import type { Locale } from '../../../content/docs/constants.js';
import { queryClient } from '../../../store/queryClient.js';
import type { Doc } from '../contracts/document.schema.js';
import {
  documentQueryKey,
  requestDocument,
} from '../application/documentRepository.js';

export type DocumentStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface UseDocumentConfig {
  readonly locale: ReadonlySignal<Locale>;
  readonly slug: ReadonlySignal<string>;
}

export interface UseDocumentReturn {
  readonly doc: ReadonlySignal<Doc | undefined>;
  readonly status: ReadonlySignal<DocumentStatus>;
  readonly error: ReadonlySignal<unknown>;
}

/** Resolves the active localized document through the shared query cache. */
export const useDocument = defineHook<UseDocumentConfig, UseDocumentReturn>({
  name: 'useDocument',
  setup: (ctx) => {
    const initialKey = documentQueryKey(
      ctx.config.locale.value,
      ctx.config.slug.value
    );
    const initialDoc = queryClient.getQueryData<Doc>(initialKey);
    const doc = ctx.signal<Doc | undefined>(initialDoc);
    const status = ctx.signal<DocumentStatus>(initialDoc ? 'ready' : 'idle');
    const error = ctx.signal<unknown>(undefined);
    let requestedKey = '';

    ctx.watchEffect(() => {
      const locale = ctx.config.locale.value;
      const slug = ctx.config.slug.value;
      const queryKey = documentQueryKey(locale, slug);
      const cached = queryClient.getQueryData<Doc>(queryKey);

      if (cached) {
        doc.value = cached;
        status.value = 'ready';
        error.value = undefined;
        requestedKey = `${locale}/${slug}`;
        return;
      }

      if (typeof window === 'undefined') return;

      const key = `${locale}/${slug}`;
      if (key === requestedKey) return;

      // Route changes clear stale content before the next payload resolves.
      // Completion guards below prevent an older request from replacing it.
      requestedKey = key;
      doc.value = undefined;
      status.value = 'loading';
      error.value = undefined;

      void ensureQueryData<Doc>(queryKey, () => requestDocument(locale, slug), {
        client: queryClient,
        staleTime: Number.POSITIVE_INFINITY,
      })
        .then((nextDoc) => {
          if (
            ctx.config.locale.value !== locale ||
            ctx.config.slug.value !== slug
          ) {
            return;
          }
          doc.value = nextDoc;
          status.value = 'ready';
        })
        .catch((cause: unknown) => {
          if (
            ctx.config.locale.value !== locale ||
            ctx.config.slug.value !== slug
          ) {
            return;
          }
          doc.value = undefined;
          status.value = 'error';
          error.value = cause;
        });
    });

    return { doc, status, error };
  },
});
