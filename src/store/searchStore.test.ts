import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { i18nStore } from './appI18n.js';
import { queryClient } from './queryClient.js';
import { searchStore } from './searchStore.js';

const emptyResponse = (): Response =>
  Response.json({ results: [] }, { status: 200 });

describe('search request scheduling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    queryClient.clear();
    searchStore.clearResults();
  });

  afterEach(() => {
    searchStore.clearResults();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('debounces rapid input to the final request', async () => {
    const fetchMock = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit) => emptyResponse()
    );
    vi.stubGlobal('fetch', fetchMock);

    searchStore.search('sign');
    searchStore.search('signals');
    await vi.advanceTimersByTimeAsync(50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain('q=signals');
  });

  it('shares a duplicate in-flight request', async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    searchStore.search('deduplication');
    await vi.advanceTimersByTimeAsync(50);
    searchStore.search('deduplication');
    await vi.advanceTimersByTimeAsync(50);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    resolveRequest?.(emptyResponse());
    await vi.runAllTimersAsync();
  });

  it('aborts a stale request when the query changes', async () => {
    const signals: AbortSignal[] = [];
    const fetchMock = vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          const signal = init?.signal;
          if (!signal) return resolve(emptyResponse());
          signals.push(signal);
          signal.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError'))
          );
        })
    );
    vi.stubGlobal('fetch', fetchMock);

    searchStore.search('signals');
    await vi.advanceTimersByTimeAsync(50);
    searchStore.search('router');
    await vi.advanceTimersByTimeAsync(50);

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(signals[0]?.aborted).toBe(true);
    expect(signals[1]?.aborted).toBe(false);
  });

  it('loads and searches the selected locale without duplicate requests', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      return url.startsWith('/locales/')
        ? Response.json({}, { status: 200 })
        : emptyResponse();
    });
    vi.stubGlobal('fetch', fetchMock);

    await i18nStore.setLocale('ja');
    searchStore.search('検索');
    await vi.advanceTimersByTimeAsync(50);

    const requestedUrls = fetchMock.mock.calls.map(([input]) => String(input));
    expect(requestedUrls.filter((url) => url === '/locales/ja.json')).toEqual([
      '/locales/ja.json',
    ]);
    expect(
      requestedUrls.filter((url) => url.startsWith('/api/search'))
    ).toEqual(['/api/search?locale=ja&q=%E6%A4%9C%E7%B4%A2']);

    await i18nStore.setLocale('en');
  });
});
