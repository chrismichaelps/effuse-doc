import { defineLayer } from '@effuse/core';
import { isTaggedError } from '../utils/data/tagged-error.js';
import { installRouter } from '@effuse/router';
import { router } from '../router';
import { getErrorMessage } from '../utils/errors.js';

interface RouterTracingService {
  isCategoryEnabled: (category: string) => boolean;
  logWithDuration: (
    category: string,
    type: string,
    name: string,
    duration: number,
    data?: Record<string, unknown>
  ) => void;
}

const isRouterTracingService = (
  value: unknown
): value is RouterTracingService =>
  typeof value === 'object' &&
  value !== null &&
  'isCategoryEnabled' in value &&
  typeof value.isCategoryEnabled === 'function' &&
  'logWithDuration' in value &&
  typeof value.logWithDuration === 'function';

export const RouterLayer = defineLayer({
  name: 'router',
  dependencies: [],
  services: {
    router: () => router,
  },
  onMount: () => {
    console.log('[RouterLayer] mounted');
  },
  onUnmount: () => {
    console.log('[RouterLayer] unmounted');
  },
  onError: (err) => {
    const message = isTaggedError(err) ? err.toString() : getErrorMessage(err);
    console.error('[RouterLayer] error:', message);
  },
  setup: (ctx) => {
    installRouter(router);

    const tracing = ctx.getService('tracing');
    let unsubscribeTracing: (() => void) | undefined;

    if (isRouterTracingService(tracing)) {
      if (tracing.isCategoryEnabled('router')) {
        let lastNavTime = performance.now();

        unsubscribeTracing = router.afterEach((to, from) => {
          const duration = performance.now() - lastNavTime;
          tracing.logWithDuration('router', 'navigation', to.path, duration, {
            from: from.path,
            to: to.path,
            params: to.params,
            name: to.name,
          });
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
