import { computed, define, signal, useHead } from '@effuse/core';
import { Link } from '@effuse/router';
import { TelemetryRail } from '../../components/TelemetryRail/index.js';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import './styles.css';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

const PACKAGE_NAMES = [
  '@effuse/core',
  '@effuse/router',
  '@effuse/store',
  '@effuse/query',
  '@effuse/use',
  '@effuse/i18n',
  '@effuse/ink',
  '@effuse/compiler',
  '@effuse/cli',
  '@effuse/server',
] as const;

const PIPELINE_STEPS = [
  ['01', 'Signal', 'Reactive source'],
  ['02', 'Computed', 'Derived value'],
  ['03', 'Component', 'Precise DOM consumer'],
  ['04', 'Layer', 'Capability owner'],
  ['05', 'API', 'Typed request contract'],
  ['06', 'Runtime', 'SSR and hydration'],
] as const;

export const HomePage = define({
  script: ({ onMount }) => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const copied = signal(false);
    let copyTimer: ReturnType<typeof setTimeout> | undefined;

    const copyCommand = () => {
      const command = 'pnpm add @effuse/core';

      void navigator.clipboard?.writeText(command).catch(() => undefined);
      copied.value = true;
      if (copyTimer !== undefined) clearTimeout(copyTimer);
      copyTimer = setTimeout(() => {
        copied.value = false;
      }, 1800);
    };

    useHead({
      title: 'Effuse - Typed Reactive Applications from Signal to Server',
      description:
        'Explore an experimental TypeScript application framework with fine-grained signals, typed capability layers, portable server APIs, and SSR.',
      og: {
        title: 'Effuse - From Signal to Server',
        description:
          'An experimental TypeScript framework for fine-grained interfaces, capability layers, portable server APIs, and SSR.',
        type: 'website',
        url: 'https://effuse-doc.vercel.app/',
        siteName: 'Effuse',
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Effuse - From Signal to Server',
        description:
          'Build typed applications with fine-grained updates, explicit capability layers, portable server APIs, and SSR.',
      },
      script: [
        {
          type: 'application/ld+json',
          content: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Effuse',
            operatingSystem: 'Any',
            applicationCategory: 'DeveloperApplication',
            description:
              'An experimental TypeScript application framework with fine-grained signals, capability layers, portable server APIs, and SSR.',
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'USD',
            },
          }),
        },
      ],
    });

    onMount(() => {
      const page = document.querySelector('.home-page');
      if (!page) return undefined;

      const reduceMotion = window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;
      if (reduceMotion) {
        return () => {
          if (copyTimer !== undefined) clearTimeout(copyTimer);
        };
      }

      const context = gsap.context(() => {
        gsap.from('.hero-reveal', {
          y: 28,
          opacity: 0,
          duration: 0.72,
          stagger: 0.1,
          ease: 'power3.out',
        });

        gsap.from('.pipeline-node', {
          scrollTrigger: {
            trigger: '.pipeline-shell',
            start: 'top 86%',
            once: true,
          },
          y: 18,
          opacity: 0,
          duration: 0.56,
          stagger: 0.08,
          ease: 'power2.out',
        });

        gsap.utils.toArray<HTMLElement>('.story-section').forEach((section) => {
          const content = section.querySelector('.story-copy');
          const visual = section.querySelector('.story-visual');

          gsap.from([content, visual], {
            scrollTrigger: {
              trigger: section,
              start: 'top 78%',
              once: true,
            },
            y: 42,
            opacity: 0,
            duration: 0.78,
            stagger: 0.12,
            ease: 'power3.out',
          });
        });

        gsap.from('.ecosystem-inner > *', {
          scrollTrigger: {
            trigger: '.ecosystem-section',
            start: 'top 82%',
            once: true,
          },
          y: 24,
          opacity: 0,
          duration: 0.62,
          stagger: 0.08,
          ease: 'power2.out',
        });
      }, page);

      return () => {
        context.revert();
        if (copyTimer !== undefined) clearTimeout(copyTimer);
      };
    });

    return {
      count,
      doubled,
      copied,
      copyCommand,
      increment: () => {
        count.value += 1;
      },
      reset: () => {
        count.value = 1;
      },
    };
  },
  template: ({ count, doubled, copied, copyCommand, increment, reset }) => (
    <main class="home-page">
      <div class="home-grid" aria-hidden="true"></div>

      <section class="hero-section" aria-labelledby="home-title">
        <div class="hero-container">
          <Link to="/docs/getting-started" class="hero-kicker hero-reveal">
            <span class="kicker-status" aria-hidden="true"></span>
            Effuse · Experimental · Signal to server
            <span aria-hidden="true">→</span>
          </Link>

          <h1 id="home-title" class="hero-heading hero-reveal">
            From signal to server,
            <span>one typed system.</span>
          </h1>

          <p class="hero-subtext hero-reveal">
            Build fine-grained interfaces and portable server applications with
            explicit capability layers, typed file-derived APIs, and SSR—using
            one TypeScript model.
          </p>

          <div class="hero-actions hero-reveal">
            <Link to="/docs/getting-started" class="home-button primary">
              Start building <span aria-hidden="true">→</span>
            </Link>
            <button
              type="button"
              class="install-command"
              onClick={copyCommand}
              aria-label="Copy pnpm installation command"
            >
              <span aria-hidden="true">$</span>
              <code>pnpm add @effuse/core</code>
              <span class="copy-state">
                {computed(() => (copied.value ? 'Copied' : 'Copy'))}
              </span>
            </button>
            <a
              href="https://github.com/chrismichaelps/effuse"
              target="_blank"
              rel="noopener noreferrer"
              class="home-button secondary"
            >
              GitHub
            </a>
          </div>

          <p class="hero-status-note hero-reveal">
            Production-oriented and actively evolving. Stable compatibility is
            not yet guaranteed.
          </p>

          <div class="pipeline-shell hero-reveal">
            <div class="pipeline-toolbar">
              <span class="pipeline-status">
                <span class="pipeline-status-dot" aria-hidden="true"></span>
                Application capability graph
              </span>
              <span class="pipeline-meta">Fine-grained DOM</span>
            </div>
            <ol
              class="pipeline-grid"
              aria-label="Effuse application capability graph"
            >
              {PIPELINE_STEPS.map(([number, title, description]) => (
                <li class="pipeline-node">
                  <span class="pipeline-number">{number}</span>
                  <strong>{title}</strong>
                  <span>{description}</span>
                </li>
              ))}
            </ol>
            <TelemetryRail
              start="state.count"
              middle="GET /api/docs"
              end="200 · hydrated"
              className="pipeline-readout"
            />
          </div>
        </div>
      </section>

      <section class="story-section" aria-labelledby="signals-title">
        <div class="story-copy">
          <span class="section-index">01 · Fine-grained reactivity</span>
          <h2 id="signals-title">Update the value, not the whole tree.</h2>
          <p>
            Signals track their consumers directly. When state changes, Effuse
            updates only the text, attribute, or class that depends on it.
          </p>
          <Link to="/docs/signals" class="text-link">
            Explore Signals <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div class="story-visual signal-lab">
          <div class="lab-toolbar">
            <span>Counter.tsx</span>
            <span class="lab-badge">LIVE</span>
          </div>
          <div class="signal-lab-body">
            <pre class="signal-code" aria-label="Signal code example">
              <code>
                <span class="code-line">
                  <span class="code-line-number">01</span>
                  <span class="code-line-content">
                    <span class="code-keyword">import</span> &#123; computed,
                    define, signal &#125; <span class="code-keyword">from</span>{' '}
                    <span class="code-string">'@effuse/core'</span>;
                  </span>
                </span>
                <span class="code-line empty">
                  <span class="code-line-number">02</span>
                  <span class="code-line-content"></span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">03</span>
                  <span class="code-line-content">
                    <span class="code-keyword">export const</span> Counter ={' '}
                    <span class="code-function">define</span>(&#123;
                  </span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">04</span>
                  <span class="code-line-content indent-1">
                    <span class="code-property">script</span>: () =&gt; &#123;
                  </span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">05</span>
                  <span class="code-line-content indent-2">
                    <span class="code-keyword">const</span> count ={' '}
                    <span class="code-function">signal</span>(
                    <span class="code-number">1</span>);
                  </span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">06</span>
                  <span class="code-line-content indent-2">
                    <span class="code-keyword">const</span> doubled ={' '}
                    <span class="code-function">computed</span>(() =&gt;
                  </span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">07</span>
                  <span class="code-line-content indent-3">
                    count.<span class="code-property">value</span> *{' '}
                    <span class="code-number">2</span>
                  </span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">08</span>
                  <span class="code-line-content indent-2">);</span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">09</span>
                  <span class="code-line-content indent-2">
                    <span class="code-keyword">return</span> &#123; count,
                    doubled &#125;;
                  </span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">10</span>
                  <span class="code-line-content indent-1">&#125;,</span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">11</span>
                  <span class="code-line-content indent-1">
                    <span class="code-property">template</span>: (&#123; count,
                    doubled &#125;) =&gt; (
                  </span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">12</span>
                  <span class="code-line-content indent-2">
                    <span class="code-tag">&lt;output&gt;</span>
                    &#123;count&#125; · &#123;doubled&#125;
                    <span class="code-tag">&lt;/output&gt;</span>
                  </span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">13</span>
                  <span class="code-line-content indent-1">),</span>
                </span>
                <span class="code-line">
                  <span class="code-line-number">14</span>
                  <span class="code-line-content">&#125;);</span>
                </span>
              </code>
            </pre>
            <div class="signal-output">
              <span class="output-label">Rendered output</span>
              <div class="output-values" aria-live="polite">
                <div>
                  <span>count</span>
                  <strong>{count}</strong>
                </div>
                <div>
                  <span>doubled</span>
                  <strong>{doubled}</strong>
                </div>
              </div>
              <div class="demo-actions">
                <button type="button" onClick={increment}>
                  Increment signal
                </button>
                <button type="button" class="quiet" onClick={reset}>
                  Reset
                </button>
              </div>
              <p class="update-note">
                <span aria-hidden="true"></span>
                Two text nodes subscribed. No tree diff.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        class="story-section story-reversed"
        aria-labelledby="layers-title"
      >
        <div class="story-copy">
          <span class="section-index">02 · Capability architecture</span>
          <h2 id="layers-title">Make dependencies visible and typed.</h2>
          <p>
            Layers own services, state, lifecycle, hooks, policy, middleware,
            routes, and actions. Components consume each capability through a
            typed local alias—without string lookup or prop drilling.
          </p>
          <Link to="/docs/layers" class="text-link">
            Understand Layers <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div class="story-visual layer-map">
          <div class="layer-map-grid" aria-label="Theme layer capability map">
            <div class="capability-node state-node">
              <span>State</span>
              <strong>mode: Signal</strong>
            </div>
            <div class="capability-node service-node">
              <span>Service</span>
              <strong>theme.toggle()</strong>
            </div>
            <div class="layer-core">
              <span>Capability</span>
              <strong>ThemeLayer</strong>
              <code>layers.theme</code>
            </div>
            <div class="capability-node lifecycle-node">
              <span>Lifecycle</span>
              <strong>setup → cleanup</strong>
            </div>
            <div class="capability-node server-node">
              <span>Server</span>
              <strong>routes + actions</strong>
            </div>
          </div>
          <div class="layer-consumer">
            <span>ThemeToggle.tsx</span>
            <code>layers: &#123; theme: ThemeLayer &#125;</code>
            <span class="type-check">Type inferred ✓</span>
          </div>
        </div>
      </section>

      <section class="story-section" aria-labelledby="server-title">
        <div class="story-copy">
          <span class="section-index">03 · Server and SSR</span>
          <h2 id="server-title">Let the file define the endpoint.</h2>
          <p>
            Effuse discovers API and action files, validates request and
            response contracts, applies middleware and cache policy, dispatches
            handlers before the SSR fallback, and hydrates the same application
            in the browser.
          </p>
          <Link to="/docs/server" class="text-link">
            Build Server APIs <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div class="story-visual server-console">
          <div class="lab-toolbar">
            <span>src/server/api/search/route.ts</span>
            <span class="lab-badge">SSR</span>
          </div>
          <div class="request-flow" aria-label="Server request lifecycle">
            <div class="request-step">
              <span>01</span>
              <div>
                <strong>Request</strong>
                <code>GET /api/search?q=define(</code>
              </div>
            </div>
            <div class="request-step">
              <span>02</span>
              <div>
                <strong>Contract</strong>
                <code>SearchQuerySchema → valid</code>
              </div>
            </div>
            <div class="request-step">
              <span>03</span>
              <div>
                <strong>File-derived handler</strong>
                <code>defineServerFileHandler('/api/search')</code>
              </div>
            </div>
            <div class="request-step complete">
              <span>04</span>
              <div>
                <strong>Response</strong>
                <code>200 JSON · cache tagged</code>
              </div>
              <span class="response-time">server</span>
            </div>
          </div>
          <div class="ssr-proof">
            <span class="ssr-dot" aria-hidden="true"></span>
            This documentation site is rendered with Effuse.
          </div>
        </div>
      </section>

      <section class="ecosystem-section" aria-labelledby="ecosystem-title">
        <div class="ecosystem-inner">
          <span class="section-index">The Effuse ecosystem</span>
          <h2 id="ecosystem-title">Start small. Keep one mental model.</h2>
          <p>
            Add routing, server-state queries, application state, reusable
            hooks, internationalization, SSR-safe Markdown, portable Node and
            Bun hosting, and build tooling without leaving the same capability
            graph.
          </p>
          <div class="package-grid" aria-label="Effuse packages">
            {PACKAGE_NAMES.map((name) => (
              <code>{name}</code>
            ))}
          </div>
          <div class="ecosystem-actions">
            <Link to="/docs/getting-started" class="home-button primary">
              Read the documentation <span aria-hidden="true">→</span>
            </Link>
            <a
              href="https://github.com/chrismichaelps/effuse"
              target="_blank"
              rel="noopener noreferrer"
              class="home-button secondary"
            >
              View source
            </a>
          </div>
        </div>
      </section>
    </main>
  ),
});
