export const BACK_TO_TOP_THRESHOLD = 480;

export const shouldShowBackToTop = (
  scrollTop: number,
  threshold = BACK_TO_TOP_THRESHOLD
): boolean => scrollTop > Math.max(0, threshold);

export const resolveBackToTopBehavior = (
  prefersReducedMotion: boolean
): ScrollBehavior => (prefersReducedMotion ? 'auto' : 'smooth');

const resolveScrollableContainer = (
  containerSelector: string
): HTMLElement | null => {
  const container = document.querySelector<HTMLElement>(containerSelector);
  if (!container) return null;
  return container.scrollHeight > container.clientHeight + 1 ? container : null;
};

export const readDocumentScrollTop = (containerSelector: string): number =>
  resolveScrollableContainer(containerSelector)?.scrollTop ??
  window.scrollY ??
  document.documentElement.scrollTop;

const clearLocationHash = (): void => {
  if (!window.location.hash) return;
  const url = new URL(window.location.href);
  url.hash = '';
  window.history.replaceState(window.history.state, '', url);
};

export const scrollDocumentToTop = (
  containerSelector: string,
  behavior: ScrollBehavior
): void => {
  const container = resolveScrollableContainer(containerSelector);
  if (container) {
    container.scrollTo({ top: 0, left: 0, behavior });
  } else if (window.__lenis) {
    window.__lenis.scrollTo(0, {
      force: true,
      immediate: behavior === 'auto',
    });
  } else {
    window.scrollTo({ top: 0, left: 0, behavior });
  }

  clearLocationHash();
};
