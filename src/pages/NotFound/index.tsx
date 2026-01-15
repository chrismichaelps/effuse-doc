import { define, useHead, effect, computed } from '@effuse/core';
import type { i18nStore as I18nStoreType } from '../../store/appI18n';
import { Link } from '@effuse/router';
import './styles.css';

export const NotFoundPage = define({
	script: ({ useStore }) => {
		const i18nStore = useStore('i18n') as typeof I18nStoreType;
		const t = computed(() => i18nStore.translations.value?.notFound);

		effect(() => {
			useHead({
				title: t.value?.meta?.title ?? '',
				description: t.value?.meta?.description ?? '',
				robots: 'noindex, follow',
			});
		});

		return { t };
	},
	template: ({ t }) => (
		<main class="not-found-page" aria-labelledby="not-found-title">
			<div class="vibrant-bg">
				<div class="aurora-blob blob-1"></div>
				<div class="aurora-blob blob-2"></div>
				<div class="aurora-blob blob-3"></div>
			</div>

			<section class="not-found-content">
				<div class="error-code">{computed(() => t.value?.code ?? '')}</div>
				<h1 id="not-found-title" class="error-title">
					{computed(() => t.value?.title ?? '')}
				</h1>
				<p class="error-message">
					{computed(() => t.value?.description ?? '')}
					<br />
					{computed(() => t.value?.track ?? '')}
				</p>

				<div class="flex flex-wrap gap-4 justify-center mt-8">
					<Link to="/" class="cta-primary">
						{computed(() => t.value?.goHome ?? '')}
						<img
							src="/icons/home.svg"
							alt="Home"
							class="w-5 h-5 text-zinc-950"
						/>
					</Link>
					<Link to="/docs/getting-started" class="cta-secondary">
						Getting Started
					</Link>
					<a
						href="https://github.com/chrismichaelps/effuse"
						target="_blank"
						rel="noopener noreferrer"
						class="cta-secondary"
					>
						GitHub Repository
					</a>
				</div>
			</section>
		</main>
	),
});
