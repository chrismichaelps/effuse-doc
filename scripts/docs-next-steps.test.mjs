import { describe, expect, it } from 'vitest';
import {
  extractSidebarSlugs,
  orderLocaleSlugs,
  renderNextSteps,
  withNextSteps,
} from './docs-next-steps.mjs';

describe('documentation Next Steps generator', () => {
  it('deduplicates known pages in sidebar order', () => {
    const nav = `
      { href: '/docs/intro' },
      { href: '/releases' },
      { href: '/docs/setup' },
      { href: '/intro' },
      { href: '/docs/intro' }
    `;

    expect(
      extractSidebarSlugs(nav, new Set(['intro', 'setup', 'orphan']))
    ).toEqual(['intro', 'setup']);
    expect(orderLocaleSlugs(['intro', 'setup'], ['orphan', 'setup'])).toEqual([
      'setup',
      'orphan',
    ]);
  });

  it('renders the next three available pages and wraps at the end', () => {
    const slugs = ['intro', 'setup', 'api', 'advanced'];
    const titles = new Map(slugs.map((slug) => [slug, slug.toUpperCase()]));

    expect(renderNextSteps('en', slugs, titles, 'api')).toBe(
      [
        '## Next Steps',
        '',
        '- [ADVANCED](/docs/advanced)',
        '- [INTRO](/docs/intro)',
        '- [SETUP](/docs/setup)',
      ].join('\n')
    );
  });

  it('replaces an existing generated section idempotently', () => {
    const source =
      '# Guide\n\nContent\n\n## Next Steps\n\n- [Old](/docs/old)\n';
    const section = '## Next Steps\n\n- [New](/docs/new)';
    const updated = withNextSteps(source, section);

    expect(updated).toBe(
      '# Guide\n\nContent\n\n## Next Steps\n\n- [New](/docs/new)\n'
    );
    expect(withNextSteps(updated, section)).toBe(updated);
  });

  it('removes legacy localized sections before adding the canonical section', () => {
    const section = '## Próximos pasos\n\n- [Nuevo](/docs/new)';

    for (const legacyHeading of ['Próximos Pasos', '下一步']) {
      const source = [
        '# Guide',
        '',
        'Content',
        '',
        `## ${legacyHeading}`,
        '',
        '- [Old](/docs/old)',
        '',
        '## 后续步骤',
        '',
        '- [Duplicate](/docs/duplicate)',
        '',
      ].join('\n');

      expect(withNextSteps(source, section)).toBe(
        '# Guide\n\nContent\n\n## Próximos pasos\n\n- [Nuevo](/docs/new)\n'
      );
    }
  });
});
