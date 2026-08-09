import { define, For } from '@effuse/core';
import { Link } from '@effuse/router';
import './styles.css';
import pkg from '../../../package.json';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
  icon?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

const footerSections: FooterSection[] = [
  {
    title: 'Site',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'About', href: '/about' },
      { label: 'Releases', href: '/releases' },
    ],
  },
  {
    title: 'Getting Started',
    links: [
      { label: 'Introduction', href: '/docs/getting-started' },
      { label: 'Installation', href: '/docs/installation' },
      { label: 'Quick Start', href: '/docs/quick-start' },
    ],
  },
  {
    title: 'Social',
    links: [
      {
        label: 'GitHub',
        href: 'https://github.com/chrismichaelps/effuse',
        external: true,
        icon: '/icons/github.svg',
      },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', href: '/terms' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Disclaimer', href: '/disclaimer' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export const Footer = define({
  script: () => {
    const version = pkg.version;
    return { sections: footerSections, version };
  },
  template: ({ sections, version }) => (
    <footer class="footer-motion">
      <div class="footer-content">
        <div class="footer-main">
          <div class="footer-brand-block">
            <Link to="/" class="footer-brand" aria-label="Effuse home">
              <img
                src="/logo/logo-white.svg"
                alt=""
                class="footer-brand-logo"
              />
              <span>Effuse</span>
            </Link>
            <p>Typed reactive applications, from signal to server.</p>
            <code class="footer-install">pnpm add @effuse/core</code>
          </div>

          <nav class="footer-nav" aria-label="Footer navigation">
            <For
              each={() => sections}
              children={(section) => (
                <section class="footer-section">
                  <h2 class="footer-section-title">{section.value.title}</h2>
                  <ul class="footer-section-links list-none p-0 m-0">
                    <For
                      each={() => section.value.links}
                      children={(link) => (
                        <li class="footer-link-item">
                          {link.value.external ? (
                            <a
                              href={link.value.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              class="footer-link footer-link-external"
                            >
                              {link.value.icon && (
                                <img
                                  src={link.value.icon}
                                  alt=""
                                  class="footer-social-icon"
                                />
                              )}
                              <span>{link.value.label}</span>
                            </a>
                          ) : (
                            <Link to={link.value.href} class="footer-link">
                              {link.value.label}
                            </Link>
                          )}
                        </li>
                      )}
                    />
                  </ul>
                </section>
              )}
            />
          </nav>
        </div>

        <div class="footer-bottom">
          <div class="footer-version">
            <span class="footer-version-dot" aria-hidden="true"></span>
            <span class="footer-version-label">Latest version:</span>
            <Link to="/releases" class="footer-version-badge">
              {version}
            </Link>
          </div>

          <div class="footer-meta">
            <span>
              © <time datetime="2025">2025</time>–
              <time datetime={new Date().getFullYear().toString()}>
                {new Date().getFullYear()}
              </time>{' '}
              Effuse
            </span>
            <span class="footer-meta-divider" aria-hidden="true"></span>
            <span>MIT License</span>
            <span class="footer-meta-divider" aria-hidden="true"></span>
            <span>Built with Effuse</span>
          </div>
        </div>
      </div>
    </footer>
  ),
});
