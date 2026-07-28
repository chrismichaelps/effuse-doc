import { define, useHead } from '@effuse/core';
import { Link } from '@effuse/router';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { FeatureCard } from '../../components/FeatureCard';
import { HeroCanvas } from '../../components/HeroCanvas';
import './styles.css';

gsap.registerPlugin(ScrollTrigger);

export const HomePage = define({
  script: ({ onMount }) => {
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
      // 1. Initial Hero Entrance Animation
      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      heroTl
        .from('.hero-heading', { y: 45, opacity: 0, duration: 1 })
        .from('.hero-subtext', { y: 30, opacity: 0, duration: 0.85 }, '-=0.6')
        .from('.hero-ctas', { y: 25, opacity: 0, duration: 0.75 }, '-=0.5');

      // 2. Hero Parallax Scale-Down & Fade Out (GSAP.com style)
      gsap.to('.hero-container', {
        scrollTrigger: {
          trigger: '.hero-section',
          start: 'top top',
          end: 'bottom top',
          scrub: 0.6,
        },
        scale: 0.94,
        opacity: 0.25,
        y: -30,
        ease: 'none',
      });

      // 3. Background Parallax Shift
      gsap.to('.blob-1', {
        scrollTrigger: {
          trigger: '.home-page',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
        y: 250,
      });

      gsap.to('.blob-2', {
        scrollTrigger: {
          trigger: '.home-page',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
        },
        y: -200,
      });

      // 4. Features Section Reveal
      gsap.from('.features-header', {
        scrollTrigger: {
          trigger: '.features-section',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      gsap.from('.features-grid article', {
        scrollTrigger: {
          trigger: '.features-grid',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: 'power3.out',
      });

      // 5. Code Window 3D Perspective Reveal
      gsap.from('.code-window', {
        scrollTrigger: {
          trigger: '.code-section',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 60,
        scale: 0.94,
        opacity: 0,
        duration: 0.9,
        ease: 'power3.out',
      });

      // 6. CTA Section Reveal
      gsap.from('.cta-container', {
        scrollTrigger: {
          trigger: '.cta-section',
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
        y: 40,
        opacity: 0,
        duration: 0.8,
        ease: 'power2.out',
      });

      return () => {
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      };
    });

    return {};
  },
  template: () => (
    <main class="home-page">
      <HeroCanvas />
      <div class="vibrant-bg" aria-hidden="true">
        <div class="aurora-blob blob-1"></div>
        <div class="aurora-blob blob-2"></div>
      </div>

      {/* Hero Section */}
      <section class="hero-section">
        <div class="hero-container">
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
        <div class="features-container">
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
        <div class="code-container">
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
        <div class="cta-container">
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
