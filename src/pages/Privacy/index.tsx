import { define, useHead, watchEffect } from '@effuse/core';
import { TelemetryRail } from '../../components/TelemetryRail/index.js';
import { useTranslation } from '../../hooks';
import '../Legal/styles.css';

export const PrivacyPage = define({
  script: () => {
    const { t } = useTranslation();

    watchEffect(() => {
      useHead({
        title: t('legal.privacy.meta.title', ''),
        description: t('legal.privacy.meta.description', ''),
      });
    });

    return { t };
  },
  template: ({ t }) => (
    <main class="legal-page">
      <div class="legal-backdrop" aria-hidden="true">
        <div class="legal-aurora legal-aurora--one"></div>
        <div class="legal-aurora legal-aurora--two"></div>
        <div class="legal-aurora legal-aurora--three"></div>
      </div>
      <div class="legal-container">
        <header class="legal-header">
          <h1 class="legal-title">{t('legal.privacy.title', '')}</h1>
          <p class="legal-subtitle">{t('legal.privacy.lastUpdated', '')}</p>
        </header>

        <TelemetryRail
          start="Effuse"
          middle="/legal/privacy"
          end="Public · Current"
          className="legal-telemetry"
        />

        <div class="legal-content">
          <section class="legal-section">
            <h2 class="legal-section-title">
              {t('legal.privacy.sections.overview.title', '')}
            </h2>
            <p class="legal-text">
              {t('legal.privacy.sections.overview.content', '')}
            </p>
          </section>

          <section class="legal-section">
            <h2 class="legal-section-title">
              {t(
                'legal.privacy.sections.collection.title',
                'Information Collection'
              )}
            </h2>
            <p class="legal-text">
              {t('legal.privacy.sections.collection.content', '')}
            </p>
          </section>

          <section class="legal-section">
            <h2 class="legal-section-title">
              {t('legal.privacy.sections.cookies.title', '')}
            </h2>
            <p class="legal-text">
              {t('legal.privacy.sections.cookies.content', '')}
            </p>
          </section>

          <section class="legal-section">
            <h2 class="legal-section-title">
              {t(
                'legal.privacy.sections.services.title',
                'Third-Party Services'
              )}
            </h2>
            <p class="legal-text">
              {t('legal.privacy.sections.services.content', '')}
            </p>
          </section>

          <section class="legal-section">
            <h2 class="legal-section-title">
              {t('legal.privacy.sections.contact.title', '')}
            </h2>
            <p class="legal-text">
              {t(
                'legal.privacy.sections.contact.content',
                'For questions, contact us at'
              )}{' '}
              <a href="mailto:chrisperezsantiago1@gmail.com" class="legal-link">
                chrisperezsantiago1@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  ),
});
