import { define, useHead, signal, computed } from '@effuse/core';
import { Link } from '@effuse/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FeatureCard } from '../../components/FeatureCard';
import { HeroCanvas } from '../../components/HeroCanvas';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

const CODE_EXAMPLES = {
  counter: {
    filename: 'Counter.tsx',
    code: `import { define, signal } from '@effuse/core';

export const Counter = define({
  script: () => {
    const count = signal(0);
    return { count, increment: () => count.value++ };
  },
  template: ({ count, increment }) => (
    <button onClick={increment} class="btn-primary">
      Count is: {count}
    </button>
  ),
});`,
  },
  signals: {
    filename: 'Reactivity.ts',
    code: `import { signal, computed, watchEffect } from '@effuse/core';

const price = signal(100);
const quantity = signal(2);
const total = computed(() => price.value * quantity.value);

watchEffect(() => {
  console.log(\`Order Total: \${total.value}\`);
});`,
  },
  server: {
    filename: 'ServerAPI.ts',
    code: `import { defineServerHandler, json } from '@effuse/server';

export const handler = defineServerHandler({
  async GET(req) {
    return json({ status: 'ok', version: '2.0.0' });
  },
});`,
  },
};

export const HomePage = define({
  script: ({ onMount }) => {
    const activeTab = signal<'counter' | 'signals' | 'server'>('counter');
    const copied = signal(false);

    const isCopied = computed(() => copied.value);

    const copyCommand = () => {
      const textToCopy = 'pnpm add @effuse/core';
      try {
        if (navigator.clipboard && window.isSecureContext) {
          navigator.clipboard.writeText(textToCopy).catch(() => {
            const textarea = document.createElement('textarea');
            textarea.value = textToCopy;
            textarea.style.position = 'fixed';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
          });
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.style.position = 'fixed';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }
      } catch {
        // Fallback catch
      }

      copied.value = true;
      setTimeout(() => {
        copied.value = false;
      }, 2000);
    };

    useHead({
      title:
        'Effuse - Modern Reactive UI Framework | High-Performance Reactive Web Development',
      description:
        'Effuse is a modern, signal-based UI framework for building high-performance web applications with fine-grained reactivity and type-safe components. Powered by Effect.',
      og: {
        title: 'Effuse - Modern Reactive UI Framework',
        description: 'Fine-grained reactivity, type-safe components',
        type: 'website',
        url: 'https://effuse-doc.vercel.app/',
        siteName: 'Effuse',
      },
      twitter: {
        card: 'summary_large_image',
        site: '@effuse',
        title: 'Effuse - Modern Reactive UI Framework',
        description:
          'Built for scale with fine-grained signals and type-safe components.',
      },
      script: [
        {
          type: 'application/ld+json',
          innerHTML: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Effuse',
            operatingSystem: 'Any',
            applicationCategory: 'DeveloperApplication',
            description:
              'A signal-based UI framework with fine-grained reactivity and type-safe components.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          }),
        } as any,
      ],
    });

    onMount(() => {
      // Hero Entrance Animation
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .from('.hero-badge', { y: 20, opacity: 0, duration: 0.6 })
        .from('.hero-heading', { y: 40, opacity: 0, duration: 0.85 }, '-=0.4')
        .from('.hero-subtext', { y: 25, opacity: 0, duration: 0.75 }, '-=0.5')
        .from('.hero-ctas', { y: 20, opacity: 0, duration: 0.65 }, '-=0.4')
        .from('.hero-stats-grid', { y: 20, opacity: 0, duration: 0.65 }, '-=0.3');

      // Hero Scroll Scale-Down & Fade Out
      gsap.to('.hero-container', {
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
        scale: 0.95,
        opacity: 0.35,
        y: -25,
        ease: 'none',
      });

      // Background Aurora Parallax Shift
      gsap.to('.blob-1', {
        scrollTrigger: {
          trigger: '.home-page',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
        y: 300,
      });

      gsap.to('.blob-2', {
        scrollTrigger: {
          trigger: '.home-page',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
        y: -250,
      });

      return () => {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    });

    return {
      activeTab,
      isCopied,
      copyCommand,
    };
  },
  template: ({ activeTab, isCopied, copyCommand }) => (
    <main class="home-page">
      <HeroCanvas />
      <div class="vibrant-bg" aria-hidden="true">
        <div class="aurora-blob blob-1"></div>
        <div class="aurora-blob blob-2"></div>
      </div>

      {/* Hero Section */}
      <section class="hero-section">
        <div class="hero-container">
          <Link to="/docs/getting-started" class="hero-badge">
            <span class="hero-badge-pill">v2.0 Released</span>
            <span class="hero-badge-text">Explore Effuse Server & Signals</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              class="hero-badge-arrow"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>

          <h1 class="hero-heading">
            A modern approach to
            <br />
            <span class="hero-gradient">Web Development</span>
          </h1>

          <p class="hero-subtext">
            Build high-performance reactive applications with fine-grained signals,
            capability-first layers, and type-safe components.
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

            <button type="button" class="command-pill" onClick={copyCommand}>
              <span class="command-prefix">$</span>
              <code class="command-code">pnpm add @effuse/core</code>
              <span class="command-icon flex items-center justify-center">
                {computed(() =>
                  isCopied.value ? (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#27c93f"
                      stroke-width="2.5"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                  )
                )}
              </span>
            </button>

            <a
              href="https://github.com/chrismichaelps/effuse"
              target="_blank"
              rel="noopener noreferrer"
              class="cta-secondary"
            >
              <img
                src="/icons/github.svg"
                alt="GitHub"
                width="18"
                height="18"
                class="github-icon"
              />
              GitHub
            </a>
          </div>

          {/* Key Metrics / Highlights Bar */}
          <div class="hero-stats-grid">
            <div class="stat-card">
              <span class="stat-number">100%</span>
              <span class="stat-label">Fine-Grained Signals</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">0 VDOM</span>
              <span class="stat-label">Virtual DOM Overhead</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">Layered</span>
              <span class="stat-label">Capability Architecture</span>
            </div>
            <div class="stat-card">
              <span class="stat-number">Full-Stack</span>
              <span class="stat-label">Built-in Server & APIs</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section class="features-section" aria-labelledby="features-title">
        <div class="features-container">
          <div class="features-header">
            <h2 id="features-title" class="features-title">
              Built for Speed & Scalability
            </h2>
            <p class="features-subtitle">
              Everything you need to write clean, type-safe reactive web apps.
            </p>
          </div>

          <div class="features-grid">
            <article>
              <FeatureCard
                icon="/logo/signals.svg"
                title="Fine-Grained Signals"
                description="Automatic dependency tracking. Only update DOM nodes that actually change."
              />
            </article>
            <article>
              <FeatureCard
                icon="/logo/components.svg"
                title="Type-Safe Components"
                description="Clean script and template separation with complete TypeScript inference."
              />
            </article>
            <article>
              <FeatureCard
                icon="/logo/efficient.svg"
                title="Capability Layers"
                description="Explicit capability-first layer architecture with typed dependency injection."
              />
            </article>
            <article>
              <FeatureCard
                icon="/icons/list.svg"
                title="Effuse Router & SSR"
                description="Seamless client SPA routing with server API route rendering handlers."
              />
            </article>
            <article>
              <FeatureCard
                icon="/logo/signals.svg"
                title="Effuse Ink & CLI"
                description="Declarative terminal UI framework for rich interactive CLI tools."
              />
            </article>
            <article>
              <FeatureCard
                icon="/logo/components.svg"
                title="i18n & Global State"
                description="Integrated reactive internationalization and state store layers."
              />
            </article>
          </div>
        </div>
      </section>

      {/* Code Interactive Showcase */}
      <section class="code-section" aria-label="Code example">
        <div class="code-container">
          <div class="code-window">
            <figcaption class="code-header">
              <div class="code-header-left">
                <div class="code-dots" aria-hidden="true">
                  <span class="code-dot red"></span>
                  <span class="code-dot yellow"></span>
                  <span class="code-dot green"></span>
                </div>
                <div class="code-tabs">
                  <button
                    type="button"
                    class={() => `code-tab ${activeTab.value === 'counter' ? 'active' : ''}`}
                    onClick={() => {
                      activeTab.value = 'counter';
                    }}
                  >
                    Counter.tsx
                  </button>
                  <button
                    type="button"
                    class={() => `code-tab ${activeTab.value === 'signals' ? 'active' : ''}`}
                    onClick={() => {
                      activeTab.value = 'signals';
                    }}
                  >
                    Reactivity.ts
                  </button>
                  <button
                    type="button"
                    class={() => `code-tab ${activeTab.value === 'server' ? 'active' : ''}`}
                    onClick={() => {
                      activeTab.value = 'server';
                    }}
                  >
                    ServerAPI.ts
                  </button>
                </div>
              </div>
              <span class="code-filename">
                {() => CODE_EXAMPLES[activeTab.value].filename}
              </span>
            </figcaption>

            <pre class="code-body">
              <code>{() => CODE_EXAMPLES[activeTab.value].code}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section class="cta-section">
        <div class="cta-container">
          <h2 class="cta-title">Ready to build with Effuse?</h2>
          <p class="cta-subtitle">
            Explore the docs, build your first component, and experience fine-grained reactivity.
          </p>
          <div class="cta-buttons">
            <Link to="/docs/getting-started" class="cta-primary">
              Read Documentation
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
        </div>
      </section>
    </main>
  ),
});
