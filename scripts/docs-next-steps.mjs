import { readFile, readdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DOCS_DIR = path.join(ROOT, 'src/content/docs');
const NAV_FILE = path.join(DOCS_DIR, 'nav.ts');

export const LOCALE_HEADINGS = {
  en: 'Next Steps',
  es: 'Próximos pasos',
  ja: '次のステップ',
  zh: '后续步骤',
};

const GENERATED_HEADING_PATTERN =
  /\n+## (?:Next Steps|Próximos pasos|次のステップ|后续步骤)\s*\n[\s\S]*$/u;

const cleanTitle = (title) =>
  title
    .replace(/\[([^\]]+)\]\([^)]+\)/gu, '$1')
    .replace(/[*_`~]/gu, '')
    .trim();

export const extractTitle = (source, slug) => {
  const heading = source.match(/^#\s+(.+)$/mu)?.[1];
  return cleanTitle(heading ?? slug.replaceAll('-', ' '));
};

export const extractSidebarSlugs = (navSource, knownSlugs) => {
  const ordered = [];
  const seen = new Set();
  const hrefPattern = /href:\s*['"]([^'"]+)['"]/gu;

  for (const match of navSource.matchAll(hrefPattern)) {
    const slug = match[1].split('/').filter(Boolean).at(-1);
    if (!slug || !knownSlugs.has(slug) || seen.has(slug)) continue;
    seen.add(slug);
    ordered.push(slug);
  }

  return ordered;
};

export const orderLocaleSlugs = (sidebarSlugs, availableSlugs) => {
  const available = new Set(availableSlugs);
  const ordered = sidebarSlugs.filter((slug) => available.has(slug));
  const included = new Set(ordered);
  const extras = availableSlugs
    .filter((slug) => !included.has(slug))
    .sort((left, right) => left.localeCompare(right));
  return [...ordered, ...extras];
};

export const renderNextSteps = (locale, orderedSlugs, titles, slug) => {
  const currentIndex = orderedSlugs.indexOf(slug);
  if (currentIndex < 0 || orderedSlugs.length < 2) return '';

  const linkCount = Math.min(3, orderedSlugs.length - 1);
  const links = Array.from({ length: linkCount }, (_, offset) => {
    const target =
      orderedSlugs[(currentIndex + offset + 1) % orderedSlugs.length];
    return `- [${titles.get(target) ?? target}](/docs/${target})`;
  });

  return `## ${LOCALE_HEADINGS[locale]}\n\n${links.join('\n')}`;
};

export const withNextSteps = (source, section) => {
  const content = source.replace(GENERATED_HEADING_PATTERN, '').trimEnd();
  return `${content}\n\n${section}\n`;
};

const markdownFiles = async (directory) =>
  (await readdir(directory))
    .filter((name) => name.endsWith('.md'))
    .sort((left, right) => left.localeCompare(right));

const run = async () => {
  const write = process.argv.includes('--write');
  const locales = Object.keys(LOCALE_HEADINGS);
  const filesByLocale = new Map();
  const allSlugs = new Set();

  for (const locale of locales) {
    const files = await markdownFiles(path.join(DOCS_DIR, locale));
    filesByLocale.set(locale, files);
    for (const file of files) allSlugs.add(file.replace(/\.md$/u, ''));
  }

  const navSource = await readFile(NAV_FILE, 'utf8');
  const sidebarSlugs = extractSidebarSlugs(navSource, allSlugs);
  const changed = [];

  for (const locale of locales) {
    const files = filesByLocale.get(locale) ?? [];
    const availableSlugs = files.map((file) => file.replace(/\.md$/u, ''));
    const orderedSlugs = orderLocaleSlugs(sidebarSlugs, availableSlugs);
    const sources = new Map();
    const titles = new Map();

    for (const file of files) {
      const slug = file.replace(/\.md$/u, '');
      const source = await readFile(path.join(DOCS_DIR, locale, file), 'utf8');
      sources.set(slug, source);
      titles.set(slug, extractTitle(source, slug));
    }

    for (const slug of orderedSlugs) {
      const source = sources.get(slug);
      if (!source) continue;
      const section = renderNextSteps(locale, orderedSlugs, titles, slug);
      const expected = withNextSteps(source, section);
      if (expected === source) continue;

      const relativePath = `src/content/docs/${locale}/${slug}.md`;
      changed.push(relativePath);
      if (write) {
        await writeFile(path.join(ROOT, relativePath), expected, 'utf8');
      }
    }
  }

  if (changed.length === 0) {
    process.stdout.write(
      'All documentation Next Steps sections are current.\n'
    );
    return;
  }

  if (write) {
    process.stdout.write(`Updated ${changed.length} documentation files.\n`);
    return;
  }

  process.stderr.write(
    `Outdated Next Steps sections (${changed.length}):\n${changed.join('\n')}\n`
  );
  process.exitCode = 1;
};

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await run();
}
