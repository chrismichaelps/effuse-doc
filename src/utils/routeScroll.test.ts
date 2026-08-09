import { describe, expect, it, vi } from 'vitest';
import { scheduleRouteScrollReset } from './routeScroll.js';

const createTarget = () => {
  const frames: Array<() => void> = [];
  const target = {
    requestFrame: vi.fn((callback: () => void) => {
      frames.push(callback);
      return frames.length;
    }),
    cancelFrame: vi.fn(),
    syncSmoothScrollToTop: vi.fn(),
    scrollWindowToTop: vi.fn(),
  };

  return { frames, target };
};

describe('route scroll restoration', () => {
  it('resets native and smooth scrolling after the route has rendered', () => {
    const { frames, target } = createTarget();

    scheduleRouteScrollReset(target, '');
    expect(target.requestFrame).toHaveBeenCalledTimes(1);

    frames[0]?.();
    expect(target.requestFrame).toHaveBeenCalledTimes(2);
    expect(target.scrollWindowToTop).not.toHaveBeenCalled();

    frames[1]?.();
    expect(target.syncSmoothScrollToTop).toHaveBeenCalledOnce();
    expect(target.scrollWindowToTop).toHaveBeenCalledOnce();
  });

  it('preserves hash navigation', () => {
    const { target } = createTarget();

    scheduleRouteScrollReset(target, '#installation');

    expect(target.requestFrame).not.toHaveBeenCalled();
    expect(target.scrollWindowToTop).not.toHaveBeenCalled();
  });

  it('cancels pending resets when another navigation starts', () => {
    const { frames, target } = createTarget();
    const cancel = scheduleRouteScrollReset(target, '');

    frames[0]?.();
    cancel();
    frames[1]?.();

    expect(target.cancelFrame).toHaveBeenCalledTimes(2);
    expect(target.scrollWindowToTop).not.toHaveBeenCalled();
  });
});
