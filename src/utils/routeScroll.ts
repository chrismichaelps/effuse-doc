interface RouteScrollTarget {
  requestFrame: (callback: () => void) => number;
  cancelFrame: (frameId: number) => void;
  syncSmoothScrollToTop: () => void;
  scrollWindowToTop: () => void;
}

export type CancelRouteScrollReset = () => void;

export const scheduleRouteScrollReset = (
  target: RouteScrollTarget,
  hash: string
): CancelRouteScrollReset => {
  if (hash) return () => undefined;

  let secondFrameId: number | undefined;
  let cancelled = false;

  const firstFrameId = target.requestFrame(() => {
    if (cancelled) return;

    secondFrameId = target.requestFrame(() => {
      if (cancelled) return;

      target.syncSmoothScrollToTop();
      target.scrollWindowToTop();
    });
  });

  return () => {
    cancelled = true;
    target.cancelFrame(firstFrameId);
    if (secondFrameId !== undefined) target.cancelFrame(secondFrameId);
  };
};
