import {
	define,
	signal,
	computed,
	useHead,
	effect,
	type ReadonlySignal,
} from '@effuse/core';
import { Ink } from '@effuse/ink';
import { DocsLayout } from '../../components/docs/DocsLayout';
import { triggerHaptic } from '../../components/Haptics';
import { taggedEnum } from '../../utils/data/index.js';
import type { i18nStore as I18nStoreType } from '../../store/appI18n';
import '../../styles/examples.css';

type ThemeLight = { readonly _tag: 'Light'; readonly primary: string };
type ThemeDark = { readonly _tag: 'Dark'; readonly primary: string };
type ThemeOcean = { readonly _tag: 'Ocean'; readonly primary: string };
type ThemeForest = { readonly _tag: 'Forest'; readonly primary: string };
type ThemeMode = ThemeLight | ThemeDark | ThemeOcean | ThemeForest;

const State = taggedEnum<ThemeMode>();

const getPrimaryColor = (theme: ThemeMode): string =>
	State.$match(theme, {
		Light: () => '#6366f1',
		Dark: () => '#818cf8',
		Ocean: () => '#06b6d4',
		Forest: () => '#22c55e',
	});

const getBackgroundColor = (theme: ThemeMode): string =>
	State.$match(theme, {
		Light: () => '#ffffff',
		Dark: () => '#0f0f0f',
		Ocean: () => '#0c4a6e',
		Forest: () => '#14532d',
	});

const getTextColor = (theme: ThemeMode): string =>
	State.$match(theme, {
		Light: () => '#1a1a2e',
		Dark: () => '#f8fafc',
		Ocean: () => '#e0f2fe',
		Forest: () => '#dcfce7',
	});

const getThemeLabel = (theme: ThemeMode): string =>
	State.$match(theme, {
		Light: () => 'Light',
		Dark: () => 'Dark',
		Ocean: () => 'Ocean',
		Forest: () => 'Forest',
	});

const cycleTheme = (current: ThemeMode): ThemeMode =>
	State.$match<ThemeMode>(current, {
		Light: () => State.Dark({ primary: '#818cf8' }),
		Dark: () => State.Ocean({ primary: '#06b6d4' }),
		Ocean: () => State.Forest({ primary: '#22c55e' }),
		Forest: () => State.Light({ primary: '#6366f1' }),
	});

interface ThemeCardProps {
	label: string | undefined;
	theme: ReadonlySignal<ThemeMode>;
}

interface ThemeCardExposed {
	label: string | undefined;
	theme: ReadonlySignal<ThemeMode>;
}

const ThemeCard = define<ThemeCardProps, ThemeCardExposed>({
	script: ({ props }) => {
		return { label: props.label, theme: props.theme };
	},
	template: ({ label, theme }) => (
		<article
			class="context-theme-card"
			style={() => ({
				background: getBackgroundColor(theme.value),
				color: getTextColor(theme.value),
				borderColor: getPrimaryColor(theme.value),
				padding: '1.5rem',
				borderRadius: '0.75rem',
				border: '2px solid',
				display: 'flex',
				flexDirection: 'column',
				gap: '0.75rem',
			})}
		>
			<h3 style={{ fontWeight: '600', fontSize: '1rem' }}>{label}</h3>
			<div
				style={() => ({
					background: getPrimaryColor(theme.value),
					height: '2rem',
					borderRadius: '0.375rem',
				})}
			/>
			<div style={{ fontSize: '0.875rem', opacity: '0.8' }}>
				{getThemeLabel(theme.value)}
			</div>
		</article>
	),
});

export const ContextPage = define({
	script: ({ onMount, useStore }) => {
		const i18nStore = useStore('i18n') as typeof I18nStoreType;

		const t = computed(() => i18nStore.translations.value?.examples?.context);

		const currentTheme = signal<ThemeMode>(State.Dark({ primary: '#818cf8' }));
		const nestedTheme = signal<ThemeMode>(State.Ocean({ primary: '#06b6d4' }));

		effect(() => {
			useHead({
				title: `${t.value?.title} - Effuse Playground`,
				description: t.value?.description,
			});
		});

		onMount(() => undefined);

		const cycleCurrentTheme = () => {
			triggerHaptic('light');
			currentTheme.value = cycleTheme(currentTheme.value);
		};

		const cycleNestedTheme = () => {
			triggerHaptic('light');
			nestedTheme.value = cycleTheme(nestedTheme.value);
			document
				.getElementById('nested-provider-section')
				?.scrollIntoView({ behavior: 'smooth', block: 'center' });
		};

		return {
			t,
			currentTheme,
			nestedTheme,
			cycleCurrentTheme,
			cycleNestedTheme,
			getPrimaryColor,
			getBackgroundColor,
			getTextColor,
			getThemeLabel,
		};
	},
	template: ({
		t,
		currentTheme,
		nestedTheme,
		cycleCurrentTheme,
		cycleNestedTheme,
	}) => (
		<DocsLayout currentPath="/context">
			<section class="example-container animate-water-drop">
				<header class="example-header">
					<h1 class="example-title">{t.value?.title}</h1>
					<p class="example-description">{t.value?.description}</p>
				</header>

				<section class="example-card" aria-labelledby="theme-switcher-title">
					<h2 id="theme-switcher-title" class="example-card-title">
						{t.value?.themeSwitcher}
					</h2>
					<p class="stat-label" style={{ marginBottom: '1rem' }}>
						{t.value?.themeSwitcherDesc}
					</p>
					<div class="flex flex-wrap gap-4" style={{ marginBottom: '1.5rem' }}>
						<button onClick={cycleCurrentTheme} class="btn-premium">
							{t.value?.changeTheme}: {getThemeLabel(currentTheme.value)}
						</button>
						<button onClick={cycleNestedTheme} class="btn-secondary">
							{t.value?.nestedOverride}: {getThemeLabel(nestedTheme.value)}
						</button>
					</div>

					<section class="stat-grid" aria-label="Theme previews">
						<ThemeCard label={t.value?.card1} theme={currentTheme} />
						<ThemeCard label={t.value?.card2} theme={currentTheme} />
						<ThemeCard label={t.value?.card3} theme={currentTheme} />
						<ThemeCard label={t.value?.card4} theme={currentTheme} />
					</section>
				</section>

				<section
					class="example-card"
					id="nested-provider-section"
					aria-labelledby="nested-provider-title"
				>
					<h2 id="nested-provider-title" class="example-card-title">
						{t.value?.nestedProviderTitle}
					</h2>
					<p class="stat-label" style={{ marginBottom: '1rem' }}>
						{t.value?.nestedProviderDesc}
					</p>
					<div
						class="context-nested-demo"
						style={() => ({
							padding: '1rem',
							background: getBackgroundColor(currentTheme.value),
							borderRadius: '0.75rem',
							border: `2px solid ${getPrimaryColor(currentTheme.value)}`,
						})}
					>
						<div
							style={() => ({
								color: getTextColor(currentTheme.value),
								marginBottom: '1rem',
							})}
						>
							{t.value?.root}: {getThemeLabel(currentTheme.value)}
						</div>
						<div
							style={() => ({
								padding: '1rem',
								background: getBackgroundColor(nestedTheme.value),
								borderRadius: '0.5rem',
								border: `2px solid ${getPrimaryColor(nestedTheme.value)}`,
							})}
						>
							<div
								style={() => ({
									color: getTextColor(nestedTheme.value),
									marginBottom: '0.5rem',
								})}
							>
								{t.value?.nested}: {getThemeLabel(nestedTheme.value)}
							</div>
							<div
								style={() => ({
									background: getPrimaryColor(nestedTheme.value),
									width: '100%',
									height: '2rem',
									borderRadius: '0.25rem',
								})}
							/>
						</div>
					</div>
				</section>

				<details class="example-card" style={{ padding: '1.5rem' }}>
					<summary
						class="stat-label"
						style={{ marginBottom: '1rem', cursor: 'pointer', outline: 'none' }}
					>
						{(t.value as any)?.howItWorks ?? 'How it works'}
					</summary>
					<div style={{ marginTop: '1rem' }}>
						<figure>
							<Ink content={computed(() => t.value?.codeSnippet ?? '')} />
						</figure>
					</div>
				</details>
			</section>
		</DocsLayout>
	),
});
