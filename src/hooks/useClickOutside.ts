import { defineHook, type Signal, type ReadonlySignal } from '@effuse/core';
import { taggedEnum } from '../utils/data/index.js';

type ClickOutsideInactive = { readonly _tag: 'Inactive' };
type ClickOutsideActive = {
	readonly _tag: 'Active';
	readonly callback: () => void;
};
type ClickOutsideState = ClickOutsideInactive | ClickOutsideActive;

const State = taggedEnum<ClickOutsideState>();

interface ClickOutsideConfig {
	selector: string;
}

interface ClickOutsideReturn {
	state: Signal<ClickOutsideState>;
	isActive: ReadonlySignal<boolean>;
	isInactive: ReadonlySignal<boolean>;
	onOutside: (callback: () => void) => void;
	init: () => void;
	destroy: () => void;
}

export const useClickOutside = defineHook<
	ClickOutsideConfig,
	ClickOutsideReturn
>({
	name: 'useClickOutside',
	setup: ({ config, signal, effect }): ClickOutsideReturn => {
		const state = signal<ClickOutsideState>(State.Inactive({}));
		const isActiveSig = signal(false);
		const isInactiveSig = signal(true);

		const isActive: ReadonlySignal<boolean> = isActiveSig;
		const isInactive: ReadonlySignal<boolean> = isInactiveSig;

		const updateDerivedState = (newState: ClickOutsideState) => {
			State.$match(newState, {
				Inactive: () => {
					isActiveSig.value = false;
					isInactiveSig.value = true;
				},
				Active: () => {
					isActiveSig.value = true;
					isInactiveSig.value = false;
				},
			});
		};

		let handleClick: ((e: Event) => void) | null = null;

		const init = () => {
			const currentState = state.value;
			State.$match(currentState, {
				Inactive: () => {
					const newState = State.Active({ callback: () => {} });
					state.value = newState;
					updateDerivedState(newState);
				},
				Active: ({ callback }) => {
					handleClick = (e: Event) => {
						const target = e.target as HTMLElement;
						if (!target.closest(config.selector)) {
							callback();
						}
					};
					document.addEventListener('click', handleClick);
				},
			});
		};

		const destroy = () => {
			const currentState = state.value;
			State.$match(currentState, {
				Inactive: () => {},
				Active: () => {
					if (handleClick) {
						document.removeEventListener('click', handleClick);
						handleClick = null;
					}
					const newState = State.Inactive({});
					state.value = newState;
					updateDerivedState(newState);
				},
			});
		};

		effect(() => {
			init();
			return destroy;
		});

		return {
			state,
			isActive,
			isInactive,
			onOutside: (callback: () => void) => {
				const newState = State.Active({ callback });
				state.value = newState;
			},
			init,
			destroy,
		};
	},
});
