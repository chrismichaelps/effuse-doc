import { defineHook, type Signal, type ReadonlySignal } from '@effuse/core';
import { taggedEnum } from '../utils/data/index.js';

interface TocItem {
  id: string;
  title: string;
}

type InitUninitialized = { readonly _tag: 'Uninitialized' };
type InitInitialized = { readonly _tag: 'Initialized' };
type InitState = InitUninitialized | InitInitialized;

type LockUnlocked = { readonly _tag: 'Unlocked' };
type LockLocked = {
  readonly _tag: 'Locked';
  readonly timeoutMs: number;
};
type LockState = LockUnlocked | LockLocked;

const Init = taggedEnum<InitState>();
const Lock = taggedEnum<LockState>();

interface ScrollSpyConfig {
  containerSelector: string;
  threshold: number;
  items?: ReadonlySignal<readonly TocItem[]>;
}

interface ScrollSpyReturn {
  initState: Signal<InitState>;
  lockState: Signal<LockState>;
  activeId: Signal<string>;
  items: Signal<TocItem[]>;
  isInitialized: ReadonlySignal<boolean>;
  isLocked: ReadonlySignal<boolean>;
  setItems: (newItems: TocItem[]) => void;
  setActiveId: (id: string) => void;
  init: () => void;
}

export const resolveActiveTocId = (
  tocItems: readonly TocItem[],
  getRelativeTop: (item: TocItem) => number | undefined,
  threshold: number,
  isAtEnd = false
): string => {
  if (tocItems.length === 0) return '';
  if (isAtEnd) return tocItems[tocItems.length - 1]?.id ?? '';

  let activeId = '';
  for (const item of tocItems) {
    const relativeTop = getRelativeTop(item);
    if (relativeTop !== undefined && relativeTop < threshold) {
      activeId = item.id;
    }
  }

  return activeId || tocItems[0]?.id || '';
};

export const useScrollSpy = defineHook<ScrollSpyConfig, ScrollSpyReturn>({
  name: 'useScrollSpy',
  setup: ({ config, signal, watchEffect }): ScrollSpyReturn => {
    const activeId = signal('');
    const items = signal<TocItem[]>([]);
    const initState = signal<InitState>(Init.Uninitialized({}));
    const lockState = signal<LockState>(Lock.Unlocked({}));

    const isInitializedSig = signal(false);
    const isLockedSig = signal(false);

    const isInitialized: ReadonlySignal<boolean> = isInitializedSig;
    const isLocked: ReadonlySignal<boolean> = isLockedSig;

    let lockTimeout: ReturnType<typeof setTimeout> | null = null;

    if (config.items) {
      watchEffect(() => {
        const nextItems = [...(config.items?.value ?? [])];
        items.value = nextItems;
        activeId.value = nextItems[0]?.id ?? '';
      });
    }

    const updateInitState = (state: InitState) => {
      Init.$match(state, {
        Uninitialized: () => {
          isInitializedSig.value = false;
        },
        Initialized: () => {
          isInitializedSig.value = true;
        },
      });
    };

    const updateLockState = (state: LockState) => {
      Lock.$match(state, {
        Unlocked: () => {
          isLockedSig.value = false;
        },
        Locked: () => {
          isLockedSig.value = true;
        },
      });
    };

    watchEffect(() => {
      // Rebuild the listeners and schedule a position check when asynchronously
      // loaded documentation replaces the current TOC.
      void items.value;
      const currentInit = initState.value;
      let isInit = false;
      Init.$match(currentInit, {
        Uninitialized: () => {
          isInit = false;
        },
        Initialized: () => {
          isInit = true;
        },
      });

      if (!isInit) return undefined;

      const container = document.querySelector(config.containerSelector);
      if (!container) return undefined;

      const handleScroll = () => {
        const currentLock = lockState.value;
        let locked = false;
        Lock.$match(currentLock, {
          Unlocked: () => {
            locked = false;
          },
          Locked: () => {
            locked = true;
          },
        });

        if (locked) return;

        const tocItems = items.value;
        if (tocItems.length === 0) return;

        const containerScrolls =
          container.scrollHeight > container.clientHeight + 1;
        const scrollRoot = containerScrolls
          ? container
          : document.documentElement;
        const referenceTop = containerScrolls
          ? container.getBoundingClientRect().top
          : 0;
        const headings = new Map<string, HTMLElement>();
        for (const heading of document.querySelectorAll<HTMLElement>(
          'h1, h2, h3'
        )) {
          const title = heading.textContent?.trim();
          if (title && !headings.has(title)) headings.set(title, heading);
        }

        const isAtEnd =
          scrollRoot.scrollTop + scrollRoot.clientHeight >=
          scrollRoot.scrollHeight - 2;

        activeId.value = resolveActiveTocId(
          tocItems,
          (item) => {
            const heading =
              document.getElementById(item.id) ?? headings.get(item.title);
            return heading
              ? heading.getBoundingClientRect().top - referenceTop
              : undefined;
          },
          config.threshold,
          isAtEnd
        );
      };

      container.addEventListener('scroll', handleScroll, { passive: true });
      window.addEventListener('scroll', handleScroll, { passive: true });

      requestAnimationFrame(() => {
        handleScroll();
      });

      return () => {
        container.removeEventListener('scroll', handleScroll);
        window.removeEventListener('scroll', handleScroll);
        Lock.$match(lockState.value, {
          Unlocked: () => {},
          Locked: () => {
            if (lockTimeout) clearTimeout(lockTimeout);
          },
        });
      };
    });

    return {
      initState,
      lockState,
      activeId,
      items,
      isInitialized,
      isLocked,
      setItems: (newItems: TocItem[]) => {
        items.value = newItems;
      },
      setActiveId: (id: string) => {
        const newLockState = Lock.Locked({ timeoutMs: 1500 });
        lockState.value = newLockState;
        updateLockState(newLockState);

        if (lockTimeout) clearTimeout(lockTimeout);
        lockTimeout = setTimeout(() => {
          const unlockState = Lock.Unlocked({});
          lockState.value = unlockState;
          updateLockState(unlockState);
        }, 1500);

        activeId.value = id;
      },
      init: () => {
        const newState = Init.Initialized({});
        initState.value = newState;
        updateInitState(newState);
      },
    };
  },
});
