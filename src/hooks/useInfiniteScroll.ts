import { defineHook, type Signal, type ReadonlySignal } from '@effuse/core';
import { taggedEnum } from '../utils/data/index.js';

type ScrollIdle = { readonly _tag: 'Idle' };
type ScrollNearBottom = {
	readonly _tag: 'NearBottom';
	readonly threshold: number;
};
type ScrollAtBottom = { readonly _tag: 'AtBottom' };
type ScrollState = ScrollIdle | ScrollNearBottom | ScrollAtBottom;

const State = taggedEnum<ScrollState>();

interface InfiniteScrollConfig {
	threshold?: number;
}

interface InfiniteScrollReturn {
	state: Signal<ScrollState>;
	isIdle: ReadonlySignal<boolean>;
	isNearBottom: ReadonlySignal<boolean>;
	isAtBottom: ReadonlySignal<boolean>;
	onLoadMore: (callback: () => void) => void;
	handleScroll: (e: Event) => void;
}

export const useInfiniteScroll = defineHook<
	InfiniteScrollConfig,
	InfiniteScrollReturn
>({
	name: 'useInfiniteScroll',
	setup: ({ config, signal }): InfiniteScrollReturn => {
		const threshold = config.threshold ?? 100;
		const state = signal<ScrollState>(State.Idle({}));
		const isIdleSig = signal(true);
		const isNearBottomSig = signal(false);
		const isAtBottomSig = signal(false);

		const isIdle: ReadonlySignal<boolean> = isIdleSig;
		const isNearBottom: ReadonlySignal<boolean> = isNearBottomSig;
		const isAtBottom: ReadonlySignal<boolean> = isAtBottomSig;

		const updateDerivedState = (newState: ScrollState) => {
			State.$match(newState, {
				Idle: () => {
					isIdleSig.value = true;
					isNearBottomSig.value = false;
					isAtBottomSig.value = false;
				},
				NearBottom: () => {
					isIdleSig.value = false;
					isNearBottomSig.value = true;
					isAtBottomSig.value = false;
				},
				AtBottom: () => {
					isIdleSig.value = false;
					isNearBottomSig.value = false;
					isAtBottomSig.value = true;
				},
			});
		};

		let loadMoreCallback: (() => void) | null = null;

		const handleScroll = (e: Event) => {
			const target = e.target as HTMLElement;
			const scrollTop = target.scrollTop;
			const scrollHeight = target.scrollHeight;
			const clientHeight = target.clientHeight;
			const distanceToBottom = scrollHeight - scrollTop - clientHeight;

			if (distanceToBottom <= 0) {
				const newState = State.AtBottom({});
				state.value = newState;
				updateDerivedState(newState);
				loadMoreCallback?.();
			} else if (distanceToBottom < threshold) {
				const newState = State.NearBottom({ threshold });
				state.value = newState;
				updateDerivedState(newState);
				loadMoreCallback?.();
			} else {
				const newState = State.Idle({});
				state.value = newState;
				updateDerivedState(newState);
			}
		};

		return {
			state,
			isIdle,
			isNearBottom,
			isAtBottom,
			onLoadMore: (callback: () => void) => {
				loadMoreCallback = callback;
			},
			handleScroll,
		};
	},
});
