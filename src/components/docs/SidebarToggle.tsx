import { define, type Signal, computed } from '@effuse/core';
import { taggedEnum, matchTag, constant } from '../../utils/data/index.js';
import { docsStore } from '../../store/docsUIStore.js';
import { useBreakpoint } from '../../hooks/index.js';

type ToggleContextMobile = {
	readonly _tag: 'Mobile';
	readonly store: typeof docsStore;
};
type ToggleContextDesktop = {
	readonly _tag: 'Desktop';
	readonly store: typeof docsStore;
};
type ToggleContextCustom = {
	readonly _tag: 'Custom';
	readonly onToggle: () => void;
};
type ToggleContext =
	| ToggleContextMobile
	| ToggleContextDesktop
	| ToggleContextCustom;

const Context = taggedEnum<ToggleContext>();

const getToggleAction = (context: ToggleContext): (() => void) => {
	const action = matchTag(context, {
		Mobile: (ctx) => () => ctx.store.toggleSidebarMobile(),
		Desktop: (ctx) => () => ctx.store.toggleSidebar(),
		Custom: (ctx) => ctx.onToggle,
		_: () => (): void => {},
	});
	return action;
};

const getContextClass = (context: ToggleContext): string =>
	matchTag(context, {
		Mobile: constant('sidebar-toggle-mobile'),
		Desktop: constant('sidebar-toggle-desktop'),
		Custom: constant('sidebar-toggle-custom'),
		_: constant(''),
	});

const getAriaLabel = (context: ToggleContext): string =>
	matchTag(context, {
		Mobile: constant('Open sidebar'),
		Desktop: constant('Toggle sidebar'),
		Custom: constant('Toggle'),
		_: constant('Toggle'),
	});

interface SidebarToggleProps {
	class?: string | Signal<string> | (() => string);
	onToggle?: () => void;
}

interface SidebarToggleExposed {
	handleClick: (e: MouseEvent) => void;
	buttonClass: Signal<string>;
	ariaLabel: string;
}

export const SidebarToggle = define<SidebarToggleProps, SidebarToggleExposed>({
	script: ({ props, useCallback, useLayerProvider }) => {
		const provider = useLayerProvider('sidebar');
		const docsUI = provider?.docsUI as typeof docsStore | undefined;
		const breakpoint = useBreakpoint({});

		const resolveContext = useCallback((): ToggleContext => {
			if (props.onToggle) {
				return Context.Custom({ onToggle: props.onToggle });
			}
			if (!docsUI) {
				return Context.Custom({ onToggle: (): void => {} });
			}
			return breakpoint.isMobile.value
				? Context.Mobile({ store: docsUI })
				: Context.Desktop({ store: docsUI });
		});

		const context = computed(resolveContext);

		const handleClick = useCallback((e: MouseEvent) => {
			e.stopPropagation();
			const action = getToggleAction(context.value);
			action();
		});

		const buttonClass = computed(() => {
			const baseClass = 'sidebar-toggle-btn';
			const contextClass = getContextClass(context.value);
			const propsClass =
				typeof props.class === 'function'
					? props.class()
					: typeof props.class === 'object' && 'value' in props.class
						? props.class.value
						: (props.class ?? '');
			return [baseClass, contextClass, propsClass].filter(Boolean).join(' ');
		});

		const ariaLabel = computed(() => getAriaLabel(context.value));

		return {
			handleClick,
			buttonClass,
			ariaLabel: ariaLabel.value,
		};
	},
	template: ({ handleClick, buttonClass, ariaLabel }) => (
		<button
			class={() => buttonClass.value}
			onClick={handleClick}
			aria-label={ariaLabel}
		>
			<img src="/icons/sidebar-toggle.svg" alt="Toggle" />
		</button>
	),
});
