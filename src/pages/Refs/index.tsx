import {
	define,
	signal,
	computed,
	useHead,
	effect,
	type RefCallback,
	type Signal,
	type ReadonlySignal,
	createRef,
} from '@effuse/core';
import { Ink } from '@effuse/ink';
import { DocsLayout } from '../../components/docs/DocsLayout';
import type { i18nStore as I18nStoreType } from '../../store/appI18n';
import { triggerHaptic } from '../../components/Haptics';
import '../../styles/examples.css';

interface RefsTranslations {
	title: string;
	description: string;
	createRefDemo: string;
	createRefDesc: string;
	callbackRefDemo: string;
	callbackRefDesc: string;
	subscriptionDemo: string;
	subscriptionDesc: string;
	dimensions: string;
	width: string;
	height: string;
	focusInput: string;
	clickCount: string;
	reset: string;
	howItWorks: string;
	resizeMe: string;
	subscribeCallbacks: string;
	typePlaceholder: string;
	toggleElement: string;
	codeSnippet: string;
}

interface Dimensions {
	width: number;
	height: number;
}

const DEFAULT_TRANSLATIONS: RefsTranslations = {
	title: 'Refs & DOM Access',
	description: 'Direct DOM element access with createRef and callback refs.',
	createRefDemo: 'createRef Demo',
	createRefDesc: 'Create a ref object with reactive current property.',
	callbackRefDemo: 'Callback Ref Demo',
	callbackRefDesc: 'Use function-based refs for element access.',
	subscriptionDemo: 'Subscription Demo',
	subscriptionDesc: 'Subscribe to ref changes for reactive updates.',
	dimensions: 'Dimensions',
	width: 'Width',
	height: 'Height',
	focusInput: 'Focus Input',
	clickCount: 'Click Count',
	reset: 'Reset',
	howItWorks: 'How it works:',
	resizeMe: 'Resize me!',
	subscribeCallbacks: 'Subscribe callbacks:',
	typePlaceholder: 'Type here...',
	toggleElement: 'Toggle Element',
	codeSnippet: `
\`\`\`tsx
import { createRef, type RefCallback } from '@effuse/core';

const boxRef = createRef<HTMLDivElement>();

boxRef.subscribe((el) => {
  if (el) {
    console.log('Element dimensions:', el.offsetWidth, el.offsetHeight);
  }
});

const current = boxRef.current;

const inputCallback: RefCallback<HTMLInputElement> = (el) => {
  if (el) el.focus();
};

<div ref={boxRef}>Tracked element</div>
<input ref={inputCallback} />
\`\`\`
`.trim(),
};

interface RefsExposed {
	translations: ReadonlySignal<RefsTranslations>;
	dimensions: Signal<Dimensions>;
	inputEl: HTMLInputElement | null;
	inputCallback: RefCallback<HTMLInputElement>;
	clickCount: Signal<number>;
	subscribeCount: Signal<number>;
	handleFocusInput: () => void;
	handleIncrementClick: () => void;
	handleReset: () => void;
	handleToggleMount: () => void;
	isMounted: Signal<boolean>;
	handleBoxRef: (el: unknown) => void;
	handleInputCallback: (el: Element | null) => void;
}

let inputEl: HTMLInputElement | null = null;

function getTranslations(store: typeof I18nStoreType): RefsTranslations {
	const refs = store.translations.value;
	if (!refs) return DEFAULT_TRANSLATIONS;

	const examples = refs.examples;
	if (!examples) return DEFAULT_TRANSLATIONS;

	const refsTranslations = examples.refs;
	if (!refsTranslations) return DEFAULT_TRANSLATIONS;

	return refsTranslations;
}

function updateDimensions(
	target: Signal<Dimensions>,
	element: HTMLDivElement
): void {
	target.value = {
		width: element.offsetWidth,
		height: element.offsetHeight,
	};
}

export const RefsPage = define<object, RefsExposed>({
	script: ({ useStore, useCallback, onMount }) => {
		const i18nStore = useStore('i18n') as typeof I18nStoreType;

		const translations = computed(() => getTranslations(i18nStore));

		effect(() => {
			const t = translations.value;
			useHead({
				title: `${t.title} - Effuse Playground`,
				description: t.description,
			});
		});

		const boxRef = createRef<HTMLDivElement>();
		const dimensions = signal<Dimensions>({ width: 0, height: 0 });

		const inputCallback: RefCallback<HTMLInputElement> = (el) => {
			inputEl = el;
		};

		const clickCount = signal(0);
		const subscribeCount = signal(0);

		onMount(() => {
			let rafId: number | null = null;
			const resizeObserver = new ResizeObserver(() => {
				if (rafId !== null) {
					cancelAnimationFrame(rafId);
				}
				rafId = requestAnimationFrame(() => {
					const el = boxRef.current;
					if (el) {
						updateDimensions(dimensions, el);
					}
					rafId = null;
				});
			});

			const unsubscribe = boxRef.subscribe((el) => {
				if (el) {
					resizeObserver.disconnect();
					resizeObserver.observe(el);
					updateDimensions(dimensions, el);
					subscribeCount.value++;
				}
			});

			return () => {
				unsubscribe();
				if (rafId !== null) {
					cancelAnimationFrame(rafId);
				}
				resizeObserver.disconnect();
			};
		});

		const handleFocusInput = useCallback(() => {
			triggerHaptic('light');
			if (inputEl) {
				inputEl.focus();
			}
		});

		const handleIncrementClick = useCallback(() => {
			triggerHaptic('light');
			clickCount.value++;
		});

		const handleReset = useCallback(() => {
			triggerHaptic('light');
			clickCount.value = 0;
		});

		const isMounted = signal(true);
		const handleToggleMount = useCallback(() => {
			triggerHaptic('light');
			isMounted.value = !isMounted.value;
		});

		const handleBoxRef = useCallback((el: unknown) => {
			const internal = boxRef as unknown as {
				_setCurrent: (el: HTMLDivElement | null) => void;
			};
			internal._setCurrent(el as HTMLDivElement | null);
		});

		const handleInputCallback = useCallback((el: Element | null) => {
			inputCallback(el as HTMLInputElement | null);
		});

		return {
			translations,
			dimensions,
			inputCallback,
			clickCount,
			subscribeCount,
			handleFocusInput,
			handleIncrementClick,
			handleReset,
			handleBoxRef,
			handleInputCallback,
			isMounted,
			handleToggleMount,
			inputEl,
		};
	},
	template: ({
		translations,
		dimensions,
		clickCount,
		subscribeCount,
		handleFocusInput,
		handleIncrementClick,
		handleReset,
		handleBoxRef,
		handleInputCallback,
		isMounted,
		handleToggleMount,
	}) => (
		<DocsLayout currentPath="/refs">
			<section
				class="example-container animate-water-drop"
				aria-label="Refs example"
			>
				<header class="example-header">
					<h1 class="example-title">{translations.value.title}</h1>
					<p class="example-description">{translations.value.description}</p>
				</header>

				<section class="example-card" aria-labelledby="create-ref-title">
					<h2 id="create-ref-title" class="example-card-title">
						{translations.value.createRefDemo}
					</h2>
					<p class="stat-label" style={{ marginBottom: '1rem' }}>
						{translations.value.createRefDesc}
					</p>

					{isMounted.value && (
						<article
							ref={handleBoxRef}
							class="stat-card resizable-box animate-water-drop"
							style={{
								minHeight: '120px',
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								justifyContent: 'center',
								gap: '0.5rem',
								resize: 'horizontal',
								overflow: 'auto',
								minWidth: '200px',
								maxWidth: '100%',
							}}
						>
							<div class="stat-label">{translations.value.dimensions}</div>
							<div class="flex gap-4">
								<div class="text-center">
									<div
										class="stat-value"
										style={{ color: 'var(--accent-mint)' }}
									>
										{dimensions.value.width}px
									</div>
									<div class="stat-label" style={{ fontSize: '0.75rem' }}>
										{translations.value.width}
									</div>
								</div>
								<div class="text-center">
									<div
										class="stat-value"
										style={{ color: 'var(--accent-purple)' }}
									>
										{dimensions.value.height}px
									</div>
									<div class="stat-label" style={{ fontSize: '0.75rem' }}>
										{translations.value.height}
									</div>
								</div>
							</div>
							<div
								class="stat-label"
								style={{
									fontSize: '0.7rem',
									opacity: '0.7',
									marginTop: '0.5rem',
								}}
							>
								{translations.value.resizeMe}
							</div>
						</article>
					)}

					<div
						class="stat-label"
						style={{ marginTop: '1rem', fontSize: '0.8rem' }}
					>
						{translations.value.subscribeCallbacks}{' '}
						<strong>{subscribeCount.value}</strong>
					</div>

					<div style={{ marginTop: '1rem' }}>
						<button onClick={handleToggleMount} class="btn-secondary">
							{translations.value.toggleElement}
						</button>
					</div>
				</section>

				<section class="example-card" aria-labelledby="callback-ref-title">
					<h2 id="callback-ref-title" class="example-card-title">
						{translations.value.callbackRefDemo}
					</h2>
					<p class="stat-label" style={{ marginBottom: '1rem' }}>
						{translations.value.callbackRefDesc}
					</p>

					<div class="flex flex-wrap gap-4 items-center">
						<input
							ref={handleInputCallback}
							type="text"
							class="form-input"
							placeholder={translations.value.typePlaceholder}
							style={{
								flex: '1',
								minWidth: '200px',
								padding: '0.75rem 1rem',
								borderRadius: '8px',
								border: '1px solid var(--border-subtle)',
								background: 'var(--surface-elevated)',
								color: 'var(--text-primary)',
							}}
						/>
						<button onClick={handleFocusInput} class="btn-premium">
							{translations.value.focusInput}
						</button>
					</div>
				</section>

				<section class="example-card" aria-labelledby="subscription-demo-title">
					<h2 id="subscription-demo-title" class="example-card-title">
						{translations.value.subscriptionDemo}
					</h2>
					<p class="stat-label" style={{ marginBottom: '1rem' }}>
						{translations.value.subscriptionDesc}
					</p>

					<section class="stat-grid" aria-label="Statistics">
						<article
							class="stat-card"
							onClick={handleIncrementClick}
							style={{ cursor: 'pointer' }}
						>
							<div class="stat-label">{translations.value.clickCount}</div>
							<div class="stat-value" style={{ color: 'var(--accent-mint)' }}>
								{clickCount.value}
							</div>
						</article>
						<article class="stat-card">
							<button onClick={handleReset} class="btn-secondary">
								{translations.value.reset}
							</button>
						</article>
					</section>
				</section>

				<details class="example-card" style={{ padding: '1.5rem' }}>
					<summary
						class="stat-label"
						style={{ marginBottom: '1rem', cursor: 'pointer', outline: 'none' }}
					>
						{translations.value.howItWorks}
					</summary>
					<div style={{ marginTop: '1rem' }}>
						<figure>
							<Ink content={computed(() => translations.value.codeSnippet)} />
						</figure>
					</div>
				</details>
			</section>
		</DocsLayout>
	),
});
