import { defineLayer } from '@effuse/core';
import { isTaggedError } from '../utils/data/tagged-error.js';
import { installRouter } from '@effuse/router';
import { router } from '../router';

export const RouterLayer = defineLayer({
  name: 'router',
  dependencies: [],
  provides: {
    router: () => router,
  },
  onMount: () => {
    console.log('[RouterLayer] mounted');
  },
  onUnmount: () => {
    console.log('[RouterLayer] unmounted');
  },
  onError: (err) => {
    const message = isTaggedError(err) ? err.toString() : (err as Error).message;
    console.error('[RouterLayer] error:', message);
  },
  setup: (ctx) => {
    installRouter(router);

    const s = ctx as { getService: (name: string) => unknown };
    const tracing = s.getService('tracing');
    let unsubscribeTracing: (() => void) | undefined;

    if (tracing && typeof tracing === 'object' && 'isCategoryEnabled' in tracing) {
      const tracingService = tracing as {
        isCategoryEnabled: (cat: string) => boolean;
        logWithDuration: (
          cat: string,
          type: string,
          name: string,
          duration: number,
          data?: Record<string, unknown>
        ) => void;
      };

      if (tracingService.isCategoryEnabled('router')) {
        let lastNavTime = performance.now();

        unsubscribeTracing = router.afterEach((to, from) => {
          const duration = performance.now() - lastNavTime;
          tracingService.logWithDuration(
            'router',
            'navigation',
            to.path,
            duration,
            { from: from.path, to: to.path, params: to.params, name: to.name }
          );
          lastNavTime = performance.now();
        });
      }
    }

    return () => {
      unsubscribeTracing?.();
      console.log('[RouterLayer] cleanup');
    };
  },
});
