import {
  computed,
  define,
  defineProps,
  signal,
  Show,
  type ReadonlySignal,
  type Signal,
} from '@effuse/core';
import { useTranslation } from '../../hooks/index.js';
import {
  BACK_TO_TOP_THRESHOLD,
  readDocumentScrollTop,
  resolveBackToTopBehavior,
  scrollDocumentToTop,
  shouldShowBackToTop,
} from './documentScroll.js';

interface BackToTopProps {
  containerSelector?: string;
  threshold?: number;
}

interface BackToTopExposed {
  isVisible: Signal<boolean>;
  label: ReadonlySignal<string>;
  handleClick: (event: MouseEvent) => void;
}

const DEFAULT_CONTAINER_SELECTOR = '.docs-main';

export const BackToTop = define({
  props: defineProps<BackToTopProps>(),
  script: ({ props, onMount }) => {
    const { t, locale } = useTranslation();
    const isVisible = signal(false);
    const containerSelector =
      props.containerSelector ?? DEFAULT_CONTAINER_SELECTOR;
    const threshold = props.threshold ?? BACK_TO_TOP_THRESHOLD;

    const label = computed(() => {
      void locale.value;
      return t('toc.backToTop', 'Back to top');
    });

    const handleClick = (event: MouseEvent): void => {
      if (event.currentTarget instanceof HTMLButtonElement) {
        event.currentTarget.blur();
      }

      const prefersReducedMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      scrollDocumentToTop(
        containerSelector,
        resolveBackToTopBehavior(prefersReducedMotion)
      );
    };

    onMount(() => {
      const container = document.querySelector<HTMLElement>(containerSelector);
      let frameId: number | undefined;

      const updateVisibility = (): void => {
        frameId = undefined;
        isVisible.value = shouldShowBackToTop(
          readDocumentScrollTop(containerSelector),
          threshold
        );
      };

      const scheduleUpdate = (): void => {
        if (frameId !== undefined) return;
        frameId = requestAnimationFrame(updateVisibility);
      };

      container?.addEventListener('scroll', scheduleUpdate, { passive: true });
      window.addEventListener('scroll', scheduleUpdate, { passive: true });
      window.addEventListener('resize', scheduleUpdate, { passive: true });
      scheduleUpdate();

      return () => {
        container?.removeEventListener('scroll', scheduleUpdate);
        window.removeEventListener('scroll', scheduleUpdate);
        window.removeEventListener('resize', scheduleUpdate);
        if (frameId !== undefined) cancelAnimationFrame(frameId);
      };
    });

    return { isVisible, label, handleClick } satisfies BackToTopExposed;
  },
  template: ({ isVisible, label, handleClick }) => (
    <Show when={() => isVisible.value}>
      {() => (
        <button
          type="button"
          class="back-to-top"
          onClick={handleClick}
          aria-label={label.value}
          title={label.value}
        >
          <span class="back-to-top-icon" aria-hidden="true">
            ↑
          </span>
          <span class="back-to-top-label">{label}</span>
        </button>
      )}
    </Show>
  ),
});
