import { define } from '@effuse/core';
import Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export const SmoothScroll = define({
  script: ({ onMount }) => {
    onMount(() => {
      if (typeof document === 'undefined') return undefined;

      const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
      });

      window.__lenis = lenis;

      let frameId: number;
      function raf(time: number) {
        lenis.raf(time);
        frameId = requestAnimationFrame(raf);
      }

      frameId = requestAnimationFrame(raf);

      return () => {
        // Lenis does not own the caller's animation frame lifecycle.
        cancelAnimationFrame(frameId);
        lenis.destroy();
        window.__lenis = undefined;
      };
    });

    return {};
  },
  template: () => null,
});
