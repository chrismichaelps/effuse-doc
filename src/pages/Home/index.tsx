import { computed, define, Show, signal, useHead } from '@effuse/core';
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

type ExampleId = 'counter' | 'query' | 'endpoint' | 'mutation';
type CodeTokenKind =
  'keyword' | 'string' | 'number' | 'function' | 'property' | 'tag';
type CodeToken = readonly [text: string, kind?: CodeTokenKind];

interface CodeExample {
  readonly id: ExampleId;
  readonly label: string;
  readonly file: string;
  readonly badge: string;
  readonly ariaLabel: string;
  readonly lines: readonly (readonly CodeToken[])[];
  readonly output: {
    readonly eyebrow: string;
    readonly title: string;
    readonly description: string;
    readonly metrics: readonly (readonly [label: string, value: string])[];
    readonly note: string;
  };
}

const CODE_EXAMPLES = [
  {
    id: 'counter',
    label: 'Signal',
    file: 'Counter.tsx',
    badge: 'LIVE',
    ariaLabel: 'Fine-grained signal code example',
    lines: [
      [
        ['import ', 'keyword'],
        ['{ computed, define, signal }'],
        [' from ', 'keyword'],
        ["'@effuse/core'", 'string'],
        [';'],
      ],
      [],
      [
        ['export const ', 'keyword'],
        ['Counter = '],
        ['define', 'function'],
        ['({'],
      ],
      [['  script', 'property'], [': () => {']],
      [
        ['    const ', 'keyword'],
        ['count = '],
        ['signal', 'function'],
        ['('],
        ['1', 'number'],
        [');'],
      ],
      [
        ['    const ', 'keyword'],
        ['doubled = '],
        ['computed', 'function'],
        ['(() =>'],
      ],
      [['      count.'], ['value', 'property'], [' * '], ['2', 'number']],
      [['    );']],
      [['    return ', 'keyword'], ['{ count, doubled };']],
      [['  },']],
      [['  template', 'property'], [': ({ count, doubled }) => (']],
      [['    <output>', 'tag'], ['{count} · {doubled}'], ['</output>', 'tag']],
      [['  ),']],
      [['});']],
    ],
    output: {
      eyebrow: 'Rendered output',
      title: 'Fine-grained state',
      description: 'Only the text nodes that read each signal update.',
      metrics: [
        ['subscriptions', '2 nodes'],
        ['reconciliation', 'none'],
      ],
      note: 'Direct subscriptions keep updates precise.',
    },
  },
  {
    id: 'query',
    label: 'Query',
    file: 'Users.tsx',
    badge: 'CACHE',
    ariaLabel: 'Validated server-state query code example',
    lines: [
      [
        ['import ', 'keyword'],
        ['{ define }'],
        [' from ', 'keyword'],
        ["'@effuse/core'", 'string'],
        [';'],
      ],
      [
        ['import ', 'keyword'],
        ['{ useQuery }'],
        [' from ', 'keyword'],
        ["'@effuse/query'", 'string'],
        [';'],
      ],
      [
        ['import ', 'keyword'],
        ['{ UsersSchema }'],
        [' from ', 'keyword'],
        ["'./contracts'", 'string'],
        [';'],
      ],
      [],
      [
        ['const ', 'keyword'],
        ['getUsers = '],
        ['async ', 'keyword'],
        ['() => {'],
      ],
      [
        ['  const ', 'keyword'],
        ['response = '],
        ['await ', 'keyword'],
        ['fetch', 'function'],
        ['('],
        ["'/api/users'", 'string'],
        [');'],
      ],
      [
        ['  if ', 'keyword'],
        ['(!response.ok) throw ', 'keyword'],
        ['new ', 'keyword'],
        ['Error', 'function'],
        ['();'],
      ],
      [
        ['  return ', 'keyword'],
        ['UsersSchema.'],
        ['parse', 'function'],
        ['('],
        ['await ', 'keyword'],
        ['response.'],
        ['json', 'function'],
        ['());'],
      ],
      [['};']],
      [],
      [
        ['export const ', 'keyword'],
        ['Users = '],
        ['define', 'function'],
        ['({'],
      ],
      [['  script', 'property'], [': () => {']],
      [
        ['    const ', 'keyword'],
        ['users = '],
        ['useQuery', 'function'],
        ['({'],
      ],
      [['      queryKey', 'property'], [": ['users'],"]],
      [['      queryFn', 'property'], [': getUsers,']],
      [['      staleTime', 'property'], [': '], ['60_000', 'number'], [',']],
      [['    });']],
      [['    return ', 'keyword'], ['{ users };']],
      [['  },']],
      [['});']],
    ],
    output: {
      eyebrow: 'Server state',
      title: 'Validated cached reads',
      description:
        'One query owns loading, errors, retries, deduplication, and freshness.',
      metrics: [
        ['request key', "['users']"],
        ['fresh for', '60 seconds'],
      ],
      note: 'Zod validates unknown JSON before it enters application state.',
    },
  },
  {
    id: 'endpoint',
    label: 'Endpoint',
    file: 'api/users/[id]/route.ts',
    badge: 'SERVER',
    ariaLabel: 'File-derived server endpoint code example',
    lines: [
      [['import ', 'keyword'], ['{']],
      [['  defineServerFileHandler,', 'property']],
      [['  defineServerRequest,', 'property']],
      [['  serverSchema,', 'property']],
      [['} from ', 'keyword'], ["'@effuse/core/server'", 'string'], [';']],
      [
        ['import ', 'keyword'],
        ['{ findUser }'],
        [' from ', 'keyword'],
        ["'../../../data/users'", 'string'],
        [';'],
      ],
      [],
      [
        ['const ', 'keyword'],
        ['request = '],
        ['defineServerRequest', 'function'],
        ['({'],
      ],
      [
        ['  params', 'property'],
        [': serverSchema.'],
        ['object', 'function'],
        ['({'],
      ],
      [
        ['    id', 'property'],
        [': serverSchema.'],
        ['string', 'property'],
        [','],
      ],
      [['  }),']],
      [['});']],
      [],
      [
        ['const ', 'keyword'],
        ['response = serverSchema.'],
        ['object', 'function'],
        ['({'],
      ],
      [
        ['  id', 'property'],
        [': serverSchema.'],
        ['string', 'property'],
        [','],
      ],
      [
        ['  name', 'property'],
        [': serverSchema.'],
        ['string', 'property'],
        [','],
      ],
      [['});']],
      [],
      [
        ['export const ', 'keyword'],
        ['GET = '],
        ['defineServerFileHandler', 'function'],
        ['('],
      ],
      [["  '/api/users/[id]'", 'string'], [',']],
      [['  { request, response },']],
      [['  async ', 'keyword'], ['({ input }) =>']],
      [['    findUser', 'function'], ['(input.params.id)']],
      [[');']],
    ],
    output: {
      eyebrow: 'Request contract',
      title: 'Path, input, and handler agree',
      description:
        'The file location derives the route while schemas validate its boundary.',
      metrics: [
        ['invalid input', '400'],
        ['runtime', 'Node · Bun'],
      ],
      note: 'Route drift and invalid responses fail at the framework boundary.',
    },
  },
  {
    id: 'mutation',
    label: 'Mutation',
    file: 'CreateUser.tsx',
    badge: 'WRITE',
    ariaLabel: 'Cache-aware API mutation code example',
    lines: [
      [['import ', 'keyword'], ['{ useMutation, useQueryClient }']],
      [['  from ', 'keyword'], ["'@effuse/query'", 'string'], [';']],
      [],
      [
        ['const ', 'keyword'],
        ['createUser = '],
        ['async ', 'keyword'],
        ['(input: NewUser) => {'],
      ],
      [
        ['  const ', 'keyword'],
        ['response = '],
        ['await ', 'keyword'],
        ['fetch', 'function'],
        ['('],
        ["'/api/users'", 'string'],
        [', {'],
      ],
      [['    method', 'property'], [": 'POST'", 'string'], [',']],
      [
        ['    headers', 'property'],
        [": { 'content-type': 'application/json' },"],
      ],
      [
        ['    body', 'property'],
        [': JSON.'],
        ['stringify', 'function'],
        ['(input),'],
      ],
      [['  });']],
      [
        ['  if ', 'keyword'],
        ['(!response.ok) throw ', 'keyword'],
        ['new ', 'keyword'],
        ['Error', 'function'],
        ['();'],
      ],
      [['  return ', 'keyword'], ['response.'], ['json', 'function'], ['();']],
      [['};']],
      [],
      [
        ['const ', 'keyword'],
        ['queryClient = '],
        ['useQueryClient', 'function'],
        ['();'],
      ],
      [
        ['const ', 'keyword'],
        ['create = '],
        ['useMutation', 'function'],
        ['({'],
      ],
      [['  mutationFn', 'property'], [': createUser,']],
      [['  onSuccess', 'property'], [': () => queryClient.']],
      [['    invalidateQueries', 'function'], ["({ queryKey: ['users'] }),"]],
      [['});']],
    ],
    output: {
      eyebrow: 'Write workflow',
      title: 'Mutate, then reconcile the cache',
      description:
        'Pending and error state stay reactive while related queries refresh.',
      metrics: [
        ['method', 'POST'],
        ['refreshes', 'users query'],
      ],
      note: 'Mutation lifecycle and cache invalidation remain explicit.',
    },
  },
] as const satisfies readonly CodeExample[];

const renderCodeExample = (example: CodeExample) => (
  <pre class="signal-code" aria-label={example.ariaLabel}>
    <code>
      {example.lines.map((tokens, index) => (
        <span class={`code-line${tokens.length === 0 ? ' empty' : ''}`}>
          <span class="code-line-number">
            {String(index + 1).padStart(2, '0')}
          </span>
          <span class="code-line-content">
            {tokens.map(([text, kind]) => (
              <span class={kind === undefined ? '' : `code-${kind}`}>
                {text}
              </span>
            ))}
          </span>
        </span>
      ))}
    </code>
  </pre>
);

const renderExampleOutput = (example: CodeExample) => (
  <aside class="signal-output example-output" aria-label={example.output.title}>
    <span class="output-label">{example.output.eyebrow}</span>
    <h3>{example.output.title}</h3>
    <p>{example.output.description}</p>
    <dl class="example-metrics">
      {example.output.metrics.map(([label, value]) => (
        <div>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
    <p class="update-note">
      <span aria-hidden="true"></span>
      {example.output.note}
    </p>
  </aside>
);

export const HomePage = define({
  script: ({ onMount }) => {
    const count = signal(1);
    const doubled = computed(() => count.value * 2);
    const copied = signal(false);
    const activeExample = signal<ExampleId>('counter');
    const activeExampleDetails = computed(
      () =>
        CODE_EXAMPLES.find((example) => example.id === activeExample.value) ??
        CODE_EXAMPLES[0]
    );
    let copyTimer: ReturnType<typeof setTimeout> | undefined;

    const selectExample = (id: ExampleId) => {
      activeExample.value = id;
    };

    const handleExampleKeydown = (event: KeyboardEvent, id: ExampleId) => {
      const currentIndex = CODE_EXAMPLES.findIndex(
        (example) => example.id === id
      );
      let nextIndex = currentIndex;

      if (event.key === 'ArrowRight') {
        nextIndex = (currentIndex + 1) % CODE_EXAMPLES.length;
      } else if (event.key === 'ArrowLeft') {
        nextIndex =
          (currentIndex - 1 + CODE_EXAMPLES.length) % CODE_EXAMPLES.length;
      } else if (event.key === 'Home') {
        nextIndex = 0;
      } else if (event.key === 'End') {
        nextIndex = CODE_EXAMPLES.length - 1;
      } else {
        return;
      }

      event.preventDefault();
      const nextExample = CODE_EXAMPLES[nextIndex];
      selectExample(nextExample.id);
      document.getElementById(`home-example-tab-${nextExample.id}`)?.focus();
    };

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
      activeExample,
      activeExampleDetails,
      copyCommand,
      selectExample,
      handleExampleKeydown,
      increment: () => {
        count.value += 1;
      },
      reset: () => {
        count.value = 1;
      },
    };
  },
  template: ({
    count,
    doubled,
    copied,
    activeExample,
    activeExampleDetails,
    copyCommand,
    selectExample,
    handleExampleKeydown,
    increment,
    reset,
  }) => (
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
          <span class="section-index">01 · Application examples</span>
          <h2 id="signals-title">Move from local state to production data.</h2>
          <p>
            Start with precise signals, then carry the same typed model through
            validated queries, file-derived endpoints, and cache-aware writes.
          </p>
          <Link to="/docs/getting-started" class="text-link">
            Explore the documentation <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div class="story-visual signal-lab">
          <div class="lab-toolbar">
            <span class="example-file">
              {() => activeExampleDetails.value.file}
            </span>
            <span class="lab-badge">
              {() => activeExampleDetails.value.badge}
            </span>
          </div>
          <div
            class="example-tabs"
            role="tablist"
            aria-label="Effuse application examples"
          >
            {CODE_EXAMPLES.map((example, index) => (
              <button
                id={`home-example-tab-${example.id}`}
                type="button"
                role="tab"
                class={() =>
                  `example-tab ${
                    activeExample.value === example.id ? 'active' : ''
                  }`
                }
                aria-selected={() => activeExample.value === example.id}
                aria-controls={`home-example-panel-${example.id}`}
                onClick={() => selectExample(example.id)}
                onKeyDown={(event: KeyboardEvent) =>
                  handleExampleKeydown(event, example.id)
                }
              >
                <span class="example-tab-index">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span class="example-tab-label">{example.label}</span>
              </button>
            ))}
          </div>
          <div class="example-telemetry" aria-hidden="true">
            <span>{() => activeExampleDetails.value.label.toLowerCase()}</span>
            <span class="example-telemetry-trace"></span>
            <span>{() => activeExampleDetails.value.badge.toLowerCase()}</span>
          </div>
          {CODE_EXAMPLES.map((example) => (
            <Show when={() => activeExample.value === example.id}>
              {() => (
                <div
                  id={`home-example-panel-${example.id}`}
                  class="signal-lab-body"
                  role="tabpanel"
                  aria-labelledby={`home-example-tab-${example.id}`}
                  tabIndex={0}
                >
                  {renderCodeExample(example)}
                  {example.id === 'counter' ? (
                    <aside
                      class="signal-output counter-output"
                      aria-label="Live signal output"
                    >
                      <span class="output-label">Rendered output</span>
                      <h3>Fine-grained state</h3>
                      <p>Only the text nodes that read each signal update.</p>
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
                    </aside>
                  ) : (
                    renderExampleOutput(example)
                  )}
                </div>
              )}
            </Show>
          ))}
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
