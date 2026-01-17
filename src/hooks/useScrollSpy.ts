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

export const useScrollSpy = defineHook<ScrollSpyConfig, ScrollSpyReturn>({
	name: 'useScrollSpy',
	setup: ({ config, signal, effect }): ScrollSpyReturn => {
		const activeId = signal('');
		const items = signal<TocItem[]>([]);
		const initState = signal<InitState>(Init.Uninitialized({}));
		const lockState = signal<LockState>(Lock.Unlocked({}));

		const isInitializedSig = signal(false);
		const isLockedSig = signal(false);

		const isInitialized: ReadonlySignal<boolean> = isInitializedSig;
		const isLocked: ReadonlySignal<boolean> = isLockedSig;

		let lockTimeout: ReturnType<typeof setTimeout> | null = null;

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

		effect(() => {
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

				let foundId = '';
				for (const item of tocItems) {
					let el = document.getElementById(item.id);
					if (!el) {
						const headings = document.querySelectorAll('h1, h2, h3');
						for (const h of headings) {
							if (h.textContent?.trim() === item.title) {
								el = h as HTMLElement;
								break;
							}
						}
					}
					if (el) {
						const rect = el.getBoundingClientRect();
						if (rect.top < config.threshold) {
							foundId = item.id;
						}
					}
				}

				const scrollTop = window.scrollY || document.documentElement.scrollTop;
				const scrollHeight = document.documentElement.scrollHeight;
				const clientHeight = window.innerHeight;
				if (scrollTop + clientHeight >= scrollHeight) {
					foundId = tocItems[tocItems.length - 1]?.id || foundId;
				}

				activeId.value = foundId || tocItems[0]?.id || '';
			};

			container.addEventListener('scroll', handleScroll, { passive: true });
			window.addEventListener('scroll', handleScroll, { passive: true });

			requestAnimationFrame(() => {
				const tocItems = items.value;
				if (tocItems.length > 0) {
					activeId.value = tocItems[0].id;
				}
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
