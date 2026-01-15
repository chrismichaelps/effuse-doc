import { define, useHead } from '@effuse/core';
import { Link } from '@effuse/router';
import { FeatureCard } from '../../components/FeatureCard';
import { useScrollReveal } from '../../utils/ui';
import './styles.css';

export const HomePage = define({
	script: ({ onMount }) => {
		useHead({
			title: 'Effuse - Modern Reactive UI Framework',
			description:
				'A signal-based UI framework with fine-grained reactivity, type-safe components, and Effect-powered architecture.',
		});
		useScrollReveal(onMount);
		return {};
	},
	template: () => (
		<main class="home-page">
			<div class="vibrant-bg" aria-hidden="true">
				<div class="aurora-blob blob-1"></div>
				<div class="aurora-blob blob-2"></div>
			</div>

			{/* Hero Section */}
			<section class="hero-section">
				<div class="hero-container reveal-on-scroll">
					<h1 class="hero-heading">
						A modern approach to
						<br />
						<span class="hero-gradient">Web Development</span>
					</h1>
					<p class="hero-subtext">
						Build reactive applications with fine-grained signals, type-safe
						components, and an Effect-powered architecture.
					</p>

					<div class="hero-ctas">
						<Link to="/docs/getting-started" class="cta-primary">
							Get Started
							<svg
								width="16"
								height="16"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								aria-hidden="true"
							>
								<path d="M5 12h14M12 5l7 7-7 7" />
							</svg>
						</Link>
						<a
							href="https://github.com/chrismichaelps/effuse"
							target="_blank"
							rel="noopener noreferrer"
							class="cta-secondary"
						>
							<img
								src="/icons/github.svg"
								alt="GitHub"
								width="20"
								height="20"
								class="github-icon"
							/>
							View on GitHub
						</a>
					</div>
				</div>
			</section>

			{/* Features Section */}
			<section class="features-section" aria-labelledby="features-title">
				<div class="features-container reveal-on-scroll">
					<div class="features-header">
						<h2 id="features-title" class="features-title">
							Everything you need
						</h2>
						<p class="features-subtitle">
							Build modern, reactive applications with confidence.
						</p>
					</div>
					<div class="features-grid">
						<article>
							<FeatureCard
								icon="/logo/signals.svg"
								title="Signals"
								description="Fine-grained reactivity. Only update what changes."
							/>
						</article>
						<article>
							<FeatureCard
								icon="/logo/components.svg"
								title="Components"
								description="Type-safe components with script and template."
							/>
						</article>
						<article>
							<FeatureCard
								icon="/logo/efficient.svg"
								title="Efficient"
								description="Optimized for performance and small bundle size."
							/>
						</article>
					</div>
				</div>
			</section>

			{/* Code Example */}
			<section class="code-section" aria-label="Code example">
				<div class="code-container reveal-on-scroll">
					<figure class="code-window">
						<figcaption class="code-header">
							<div class="code-dots" aria-hidden="true">
								<span class="code-dot"></span>
								<span class="code-dot"></span>
								<span class="code-dot"></span>
							</div>
							<span class="code-filename">Counter.tsx</span>
						</figcaption>
						<pre class="code-body">
							<code>{`import { define, signal } from '@effuse/core';
							
const Counter = define({
  script: () => {
    const count = signal(0);
    return { count, increment: () => count.value++ };
  },
  template: ({ count, increment }) => (
    <button onClick={increment}>
      Count: {count}
    </button>
  ),
});`}</code>
						</pre>
					</figure>
				</div>
			</section>

			{/* CTA Section */}
			<section class="cta-section">
				<div class="cta-container reveal-on-scroll">
					<h2 class="cta-title">Ready to start?</h2>
					<p class="cta-subtitle">
						Read the documentation and build your first app.
					</p>
					<Link to="/docs/getting-started" class="cta-primary">
						Read the Documentation
						<svg
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							aria-hidden="true"
						>
							<path d="M5 12h14M12 5l7 7-7 7" />
						</svg>
					</Link>
				</div>
			</section>
		</main>
	),
});
