import { define, useHead, watchEffect } from '@effuse/core';
import { TelemetryRail } from '../../components/TelemetryRail/index.js';
import { useTranslation } from '../../hooks';
import '../Legal/styles.css';

export const ContactPage = define({
  script: () => {
    const { t } = useTranslation();

    watchEffect(() => {
      useHead({
        title: t('legal.contact.meta.title', ''),
        description: t(
          'legal.contact.meta.description',
          'Get in touch with us'
        ),
      });
    });

    return { t };
  },
  template: ({ t }) => (
    <main class="legal-page legal-page-contact">
      <div class="legal-backdrop" aria-hidden="true">
        <div class="legal-aurora legal-aurora--one"></div>
        <div class="legal-aurora legal-aurora--two"></div>
        <div class="legal-aurora legal-aurora--three"></div>
      </div>
      <div class="legal-container">
        <header class="legal-header">
          <h1 class="legal-title">{t('legal.contact.title', '')}</h1>
        </header>

        <TelemetryRail
          start="Effuse"
          middle="/contact"
          end="Open · Direct"
          className="legal-telemetry"
        />

        <div class="legal-content">
          <section class="legal-section legal-contact-card">
            <p class="legal-text">
              {t(
                'legal.contact.content',
                'For any questions, please contact us at:'
              )}
            </p>
            <p class="legal-text legal-contact-email">
              <a href="mailto:chrisperezsantiago1@gmail.com" class="legal-link">
                chrisperezsantiago1@gmail.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  ),
});
