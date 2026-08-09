const DEFAULT_OFFSET = 24;
const MOBILE_GAP = 16;

const resolveOffset = (): number => {
  const mobileHeader = document.getElementById('nd-tocnav');
  if (!mobileHeader || mobileHeader.offsetParent === null)
    return DEFAULT_OFFSET;
  return mobileHeader.getBoundingClientRect().height + MOBILE_GAP;
};

const updateHash = (id: string): void => {
  const url = new URL(window.location.href);
  url.hash = id;
  window.history.replaceState(window.history.state, '', url);
};

/** Scrolls the active document container and synchronizes its URL fragment. */
export const scrollToDocumentHeading = (
  id: string,
  containerSelector = '.docs-main'
): boolean => {
  const heading = document.getElementById(id);
  if (!heading) return false;

  const container = document.querySelector<HTMLElement>(containerSelector);
  const offset = resolveOffset();
  const containerScrolls =
    container !== null && container.scrollHeight > container.clientHeight + 1;

  if (container && containerScrolls) {
    const headingRect = heading.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    container.scrollTo({
      top: headingRect.top - containerRect.top + container.scrollTop - offset,
      behavior: 'smooth',
    });
  } else {
    window.scrollTo({
      top: heading.getBoundingClientRect().top + window.scrollY - offset,
      behavior: 'smooth',
    });
  }

  updateHash(id);
  return true;
};

/**
 * Waits for route content to settle before resolving a document anchor.
 * Returns a cancellation function for teardown or superseding navigation.
 */
export const scheduleDocumentHeadingScroll = (
  id: string,
  maxFrames = 30,
  expectedPathname?: string
): (() => void) => {
  let frameId: number | undefined;
  let remainingFrames = maxFrames;

  const attempt = (): void => {
    frameId = undefined;
    // The document marker prevents a shared anchor from matching stale route
    // content while the next payload is still loading.
    const routeIsReady =
      expectedPathname === undefined ||
      (window.location.pathname === expectedPathname &&
        document.querySelector<HTMLElement>('article[data-document-path]')
          ?.dataset.documentPath === expectedPathname);
    if ((routeIsReady && scrollToDocumentHeading(id)) || remainingFrames <= 0)
      return;
    remainingFrames -= 1;
    frameId = requestAnimationFrame(attempt);
  };

  attempt();
  return () => {
    if (frameId !== undefined) cancelAnimationFrame(frameId);
  };
};
