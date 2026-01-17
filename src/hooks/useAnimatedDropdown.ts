import { defineHook, type Signal, type ReadonlySignal } from '@effuse/core';
import { taggedEnum } from '../utils/data/index.js';

type DropdownClosed = {
	readonly _tag: 'Closed';
	readonly initialized: boolean;
};
type DropdownOpening = { readonly _tag: 'Opening' };
type DropdownOpen = { readonly _tag: 'Open' };
type DropdownClosing = { readonly _tag: 'Closing' };
type DropdownState =
	| DropdownClosed
	| DropdownOpening
	| DropdownOpen
	| DropdownClosing;

const State = taggedEnum<DropdownState>();

type AnimateOpenFn = (el: HTMLElement) => void;
type AnimateCloseFn = (el: HTMLElement) => void;
type StaggerFn = (el: HTMLElement, selector: string, delay: number) => void;

interface AnimatedDropdownConfig {
	animateOpen: AnimateOpenFn;
	animateClose: AnimateCloseFn;
	staggerChildren?: StaggerFn;
	staggerSelector?: string;
	staggerDelay?: number;
}

interface AnimatedDropdownReturn {
	state: Signal<DropdownState>;
	isOpen: ReadonlySignal<boolean>;
	isClosed: ReadonlySignal<boolean>;
	isAnimating: ReadonlySignal<boolean>;
	ref: Signal<HTMLElement | null>;
	toggle: () => void;
	open: () => void;
	close: () => void;
	init: () => void;
}

export const useAnimatedDropdown = defineHook<
	AnimatedDropdownConfig,
	AnimatedDropdownReturn
>({
	name: 'useAnimatedDropdown',
	setup: ({ config, signal, effect }): AnimatedDropdownReturn => {
		const state = signal<DropdownState>(State.Closed({ initialized: false }));
		const ref = signal<HTMLElement | null>(null);

		const isOpenSig = signal(false);
		const isClosedSig = signal(true);
		const isAnimatingSig = signal(false);

		const isOpen: ReadonlySignal<boolean> = isOpenSig;
		const isClosed: ReadonlySignal<boolean> = isClosedSig;
		const isAnimating: ReadonlySignal<boolean> = isAnimatingSig;

		const updateDerivedState = (newState: DropdownState) => {
			State.$match(newState, {
				Closed: () => {
					isOpenSig.value = false;
					isClosedSig.value = true;
					isAnimatingSig.value = false;
				},
				Opening: () => {
					isOpenSig.value = true;
					isClosedSig.value = false;
					isAnimatingSig.value = true;
				},
				Open: () => {
					isOpenSig.value = true;
					isClosedSig.value = false;
					isAnimatingSig.value = false;
				},
				Closing: () => {
					isOpenSig.value = false;
					isClosedSig.value = false;
					isAnimatingSig.value = true;
				},
			});
		};

		effect(() => {
			const currentState = state.value;
			const el = ref.value;
			if (!el) return undefined;

			State.$match(currentState, {
				Opening: () => {
					config.animateOpen(el);
					if (config.staggerChildren && config.staggerSelector) {
						requestAnimationFrame(() => {
							config.staggerChildren!(
								el,
								config.staggerSelector!,
								config.staggerDelay ?? 0.03
							);
						});
					}
					state.value = State.Open({});
				},
				Closing: () => {
					config.animateClose(el);
				},
				Open: () => {},
				Closed: () => {},
			});

			return undefined;
		});

		return {
			state,
			isOpen,
			isClosed,
			isAnimating,
			ref,
			toggle: () => {
				const newState = State.$match<DropdownState>(state.value, {
					Closed: () => State.Opening({}),
					Opening: () => State.Closing({}),
					Open: () => State.Closing({}),
					Closing: () => State.Opening({}),
				});
				state.value = newState;
				updateDerivedState(newState);
			},
			open: () => {
				const newState = State.Opening({});
				state.value = newState;
				updateDerivedState(newState);
			},
			close: () => {
				const newState = State.$match<DropdownState>(state.value, {
					Closed: () => State.Closed({ initialized: true }),
					Opening: () => State.Closing({}),
					Open: () => State.Closing({}),
					Closing: () => State.Closing({}),
				});
				state.value = newState;
				updateDerivedState(newState);
			},
			init: () => {
				state.value = State.Closed({ initialized: true });
				updateDerivedState(State.Closed({ initialized: true }));
				const el = ref.value;
				if (el) {
					el.style.display = 'none';
					el.style.opacity = '0';
				}
			},
		};
	},
});
