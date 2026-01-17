import { defineHook, type Signal } from '@effuse/core';
import { taggedEnum } from '../utils/data/index.js';

type ToggleOff = { readonly _tag: 'Off' };
type ToggleOn = { readonly _tag: 'On' };
type ToggleState = ToggleOff | ToggleOn;

const State = taggedEnum<ToggleState>();

interface ToggleConfig {
	initial?: boolean;
}

interface ToggleReturn {
	state: Signal<ToggleState>;
	isOn: Signal<boolean>;
	isOff: Signal<boolean>;
	isOpen: Signal<boolean>;
	toggle: () => void;
	setOn: () => void;
	setOff: () => void;
	set: (value: boolean) => void;
}

export const useToggle = defineHook<ToggleConfig, ToggleReturn>({
	name: 'useToggle',
	setup: ({ config, signal }): ToggleReturn => {
		const initialValue = config.initial ?? false;
		const state = signal<ToggleState>(
			initialValue ? State.On({}) : State.Off({})
		);

		const isOn = signal(initialValue);
		const isOff = signal(!initialValue);
		const isOpen = isOn;

		const updateDerivedState = (newState: ToggleState) => {
			State.$match(newState, {
				On: () => {
					isOn.value = true;
					isOff.value = false;
				},
				Off: () => {
					isOn.value = false;
					isOff.value = true;
				},
			});
		};

		updateDerivedState(state.value);

		return {
			state,
			isOn,
			isOff,
			isOpen,
			toggle: () => {
				const newState = State.$match<ToggleState>(state.value, {
					On: () => State.Off({}),
					Off: () => State.On({}),
				});
				state.value = newState;
				updateDerivedState(newState);
			},
			setOn: () => {
				const newState = State.On({});
				state.value = newState;
				updateDerivedState(newState);
			},
			setOff: () => {
				const newState = State.Off({});
				state.value = newState;
				updateDerivedState(newState);
			},
			set: (value: boolean) => {
				const newState = value ? State.On({}) : State.Off({});
				state.value = newState;
				updateDerivedState(newState);
			},
		};
	},
});
