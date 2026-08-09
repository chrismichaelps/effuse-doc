import { afterEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import {
  DocumentRequestError,
  documentQueryKey,
  requestDocument,
} from './documentRepository.js';

const validDocument = {
  slug: 'getting-started',
  locale: 'en',
  title: 'Getting Started',
  content: '# Getting Started',
  toc: [{ id: 'getting-started', title: 'Getting Started', level: 1 }],
};

describe('document repository', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses a stable locale-aware cache key', () => {
    expect(documentQueryKey('ja', 'i18n')).toEqual(['docs', 'ja', 'i18n']);
  });

  it('validates untrusted API payloads at the repository boundary', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(validDocument))
    );
    await expect(requestDocument('en', 'getting-started')).resolves.toEqual(
      validDocument
    );

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ ...validDocument, toc: 'invalid' }))
    );
    await expect(
      requestDocument('en', 'getting-started')
    ).rejects.toBeInstanceOf(ZodError);
  });

  it('preserves HTTP status information for application error handling', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 404 }))
    );

    await expect(requestDocument('en', 'missing')).rejects.toMatchObject({
      status: 404,
      slug: 'missing',
    } satisfies Partial<DocumentRequestError>);
  });
});
