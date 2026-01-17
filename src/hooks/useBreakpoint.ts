import { defineHook, type Signal, type ReadonlySignal } from '@effuse/core';
import {
	taggedEnum,
	TaggedError,
	matchTag,
	pipe,
	isNumber,
} from '../utils/data/index.js';
import { isTaggedError } from '../utils/data/tagged-error.js';

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

type BreakpointMobile = {
	readonly _tag: 'Mobile';
	readonly width: number;
};

type BreakpointTablet = {
	readonly _tag: 'Tablet';
	readonly width: number;
};

type BreakpointDesktop = {
	readonly _tag: 'Desktop';
	readonly width: number;
};

type BreakpointState = BreakpointMobile | BreakpointTablet | BreakpointDesktop;

const Breakpoint = taggedEnum<BreakpointState>();

const Mobile = (width: number) => Breakpoint.Mobile({ width });
const Tablet = (width: number) => Breakpoint.Tablet({ width });
const Desktop = (width: number) => Breakpoint.Desktop({ width });

const BreakpointError = TaggedError('BreakpointError');

type BreakpointErrorType =
	| { readonly _tag: 'InvalidWidth'; readonly width: unknown }
	| { readonly _tag: 'NotMounted'; readonly message: string };

const isValidWidth = (w: unknown): w is number =>
	isNumber(w) && Number.isFinite(w) && w >= 0;

const toBreakpoint = (width: number): BreakpointState => {
	if (!isValidWidth(width)) {
		throw new BreakpointError({
			_tag: 'InvalidWidth',
			width,
		} as BreakpointErrorType);
	}

	return pipe(width, (w): BreakpointState => {
		if (w < MOBILE_BREAKPOINT) {
			return Mobile(w);
		}
		if (w < TABLET_BREAKPOINT) {
			return Tablet(w);
		}
		return Desktop(w);
	});
};

interface BreakpointConfig {
	readonly mobile?: number;
	readonly tablet?: number;
}

interface BreakpointReturn {
	readonly state: Signal<BreakpointState>;
	readonly width: ReadonlySignal<number>;
	readonly isMobile: ReadonlySignal<boolean>;
	readonly isTablet: ReadonlySignal<boolean>;
	readonly isDesktop: ReadonlySignal<boolean>;
	readonly isMobileOrSmaller: ReadonlySignal<boolean>;
	readonly isTabletOrSmaller: ReadonlySignal<boolean>;
	readonly breakpoint: ReadonlySignal<string>;
	readonly init: () => void;
	readonly destroy: () => void;
}

export const useBreakpoint = defineHook<BreakpointConfig, BreakpointReturn>({
	name: 'useBreakpoint',
	setup: ({ signal, effect }): BreakpointReturn => {
		const state = signal<BreakpointState>(null as unknown as BreakpointState);
		const isMounted = signal(false);

		const isMobileSig = signal(false);
		const isTabletSig = signal(false);
		const isDesktopSig = signal(false);
		const isMobileOrSmallerSig = signal(true);
		const isTabletOrSmallerSig = signal(true);

		const width: ReadonlySignal<number> = signal(0);

		const isMobile: ReadonlySignal<boolean> = isMobileSig;
		const isTablet: ReadonlySignal<boolean> = isTabletSig;
		const isDesktop: ReadonlySignal<boolean> = isDesktopSig;
		const isMobileOrSmaller: ReadonlySignal<boolean> = isMobileOrSmallerSig;
		const isTabletOrSmaller: ReadonlySignal<boolean> = isTabletOrSmallerSig;

		const breakpoint: ReadonlySignal<string> = signal('');

		const updateDerivedState = (newState: BreakpointState): void => {
			matchTag(newState, {
				Mobile: ({ width: w }) => {
					isMobileSig.value = true;
					isTabletSig.value = false;
					isDesktopSig.value = false;
					isMobileOrSmallerSig.value = true;
					isTabletOrSmallerSig.value = true;
					(breakpoint as Signal<string>).value = 'mobile';
					(width as Signal<number>).value = w;
				},
				Tablet: ({ width: w }) => {
					isMobileSig.value = false;
					isTabletSig.value = true;
					isDesktopSig.value = false;
					isMobileOrSmallerSig.value = false;
					isTabletOrSmallerSig.value = true;
					(breakpoint as Signal<string>).value = 'tablet';
					(width as Signal<number>).value = w;
				},
				Desktop: ({ width: w }) => {
					isMobileSig.value = false;
					isTabletSig.value = false;
					isDesktopSig.value = true;
					isMobileOrSmallerSig.value = false;
					isTabletOrSmallerSig.value = false;
					(breakpoint as Signal<string>).value = 'desktop';
					(width as Signal<number>).value = w;
				},
				_: () => {},
			});
		};

		let resizeObserver: ResizeObserver | null = null;
		let resizeTimeout: ReturnType<typeof setTimeout> | null = null;

		const init = (): void => {
			if (typeof window === 'undefined') {
				return;
			}

			if (isMounted.value) {
				return;
			}

			try {
				const initialWidth = window.innerWidth;
				const initialState = toBreakpoint(initialWidth);
				state.value = initialState;
				updateDerivedState(initialState);
				isMounted.value = true;

				const handleResize = (): void => {
					if (resizeTimeout) {
						clearTimeout(resizeTimeout);
					}

					resizeTimeout = setTimeout(() => {
						const newWidth = window.innerWidth;
						const newState = toBreakpoint(newWidth);
						state.value = newState;
						updateDerivedState(newState);
					}, 100);
				};

				resizeObserver = new ResizeObserver(() => {
					handleResize();
				});

				resizeObserver.observe(document.documentElement);

				window.addEventListener('resize', handleResize, { passive: true });
			} catch (error) {
				const err = error as Error;
				if (isTaggedError(err) && err._tag === 'BreakpointError') {
					console.error('[useBreakpoint] Failed to initialize:', err.message);
				} else {
					console.error('[useBreakpoint] Unexpected error:', err);
				}
			}
		};

		const destroy = (): void => {
			isMounted.value = false;

			if (resizeTimeout) {
				clearTimeout(resizeTimeout);
				resizeTimeout = null;
			}

			if (resizeObserver) {
				resizeObserver.disconnect();
				resizeObserver = null;
			}

			const clearedState = null as unknown as BreakpointState;
			state.value = clearedState;
		};

		effect(() => {
			init();
			return destroy;
		});

		return {
			state,
			width,
			isMobile,
			isTablet,
			isDesktop,
			isMobileOrSmaller,
			isTabletOrSmaller,
			breakpoint,
			init,
			destroy,
		};
	},
});

export type { BreakpointState, BreakpointErrorType };
export { Mobile, Tablet, Desktop, BreakpointError };
