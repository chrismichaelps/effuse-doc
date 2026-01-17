import { defineHook, type Signal, type ReadonlySignal } from '@effuse/core';
import { taggedEnum } from '../utils/data/index.js';
import Lenis from 'lenis';

type SmoothScrollUninitialized = { readonly _tag: 'Uninitialized' };
type SmoothScrollActive = {
	readonly _tag: 'Active';
	readonly lenis: Lenis;
};
type SmoothScrollState = SmoothScrollUninitialized | SmoothScrollActive;

const State = taggedEnum<SmoothScrollState>();

interface SmoothScrollConfig {
	wrapper?: string;
	content?: string;
	duration?: number;
}

interface SmoothScrollReturn {
	state: Signal<SmoothScrollState>;
	isActive: ReadonlySignal<boolean>;
	isUninitialized: ReadonlySignal<boolean>;
	init: () => void;
	scrollTo: (target: string | number) => void;
}

export const useSmoothScroll = defineHook<
	SmoothScrollConfig,
	SmoothScrollReturn
>({
	name: 'useSmoothScroll',
	setup: ({ config, signal, effect }): SmoothScrollReturn => {
		const state = signal<SmoothScrollState>(State.Uninitialized({}));
		const isActiveSig = signal(false);
		const isUninitializedSig = signal(true);

		const isActive: ReadonlySignal<boolean> = isActiveSig;
		const isUninitialized: ReadonlySignal<boolean> = isUninitializedSig;

		const updateDerivedState = (newState: SmoothScrollState) => {
			State.$match(newState, {
				Uninitialized: () => {
					isActiveSig.value = false;
					isUninitializedSig.value = true;
				},
				Active: () => {
					isActiveSig.value = true;
					isUninitializedSig.value = false;
				},
			});
		};

		effect(() => {
			const currentState = state.value;
			let isInit = false;
			State.$match(currentState, {
				Uninitialized: () => {
					isInit = false;
				},
				Active: () => {
					isInit = true;
				},
			});

			if (!isInit) return undefined;

			const wrapper = config.wrapper
				? document.querySelector(config.wrapper)
				: undefined;
			const content = config.content
				? document.querySelector(config.content)
				: undefined;

			const lenis = new Lenis({
				wrapper: wrapper as HTMLElement | undefined,
				content: content as HTMLElement | undefined,
				duration: config.duration ?? 1.2,
				easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
				orientation: 'vertical',
				gestureOrientation: 'vertical',
				smoothWheel: true,
			});

			const activeState = State.Active({ lenis });
			state.value = activeState;
			updateDerivedState(activeState);

			let rafId: number;
			function raf(time: number) {
				lenis.raf(time);
				rafId = requestAnimationFrame(raf);
			}
			rafId = requestAnimationFrame(raf);

			return () => {
				cancelAnimationFrame(rafId);
				lenis.destroy();
				const inactiveState = State.Uninitialized({});
				state.value = inactiveState;
				updateDerivedState(inactiveState);
			};
		});

		return {
			state,
			isActive,
			isUninitialized,
			init: () => {
				const currentState = state.value;
				State.$match(currentState, {
					Uninitialized: () => {
						const newState = State.Uninitialized({});
						state.value = newState;
						updateDerivedState(newState);
					},
					Active: () => {},
				});
			},
			scrollTo: (target: string | number) => {
				const currentState = state.value;
				State.$match(currentState, {
					Uninitialized: () => {},
					Active: ({ lenis }) => {
						lenis.scrollTo(target);
					},
				});
			},
		};
	},
});
