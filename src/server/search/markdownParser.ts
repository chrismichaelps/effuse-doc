import { Option, some, none, getOrElse } from '../../utils/data/index.js';

export interface DocHeading {
  text: string;
  id: string;
  level: number;
}

export interface DocCodeBlock {
  id: string;
  language?: string;
  code: string;
  headingId?: string;
  headingText?: string;
  startLine: number;
}

export interface DocEntry {
  id: string;
  title: string;
  text: string;
  codeContent: string;
  codeBlocks: DocCodeBlock[];
  path: string;
  headings: DocHeading[];
}

const extractTitle = (content: string, fileName: string): Option<string> => {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return some(h1Match[1].trim());

  const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/m);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1];
    const titleMatch = frontmatter.match(/^title:\s*(.+)$/m);
    if (titleMatch) return some(titleMatch[1].trim());
  }

  const fallback = fileName
    .replace(/.md$/, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return fallback ? some(fallback) : none();
};

interface PositionedHeading {
  heading: DocHeading;
  offset: number;
}

const extractPositionedHeadings = (content: string): PositionedHeading[] => {
  const headings: PositionedHeading[] = [];
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  let match;

  while ((match = headingRegex.exec(content)) !== null) {
    const level = match[1].length;
    let text = match[2].trim();
    text = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*_~]+/g, '');

    const id = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '')
      .replace(/-{2,}/g, '-');

    const baseId = id || `section-${headings.length + 1}`;
    let uniqueId = baseId;
    let counter = 1;
    while (headings.some(({ heading }) => heading.id === uniqueId)) {
      uniqueId = `${baseId}-${++counter}`;
    }

    headings.push({
      heading: { text, id: uniqueId, level },
      offset: match.index,
    });
  }

  return headings;
};

const MAX_CODE_BLOCKS = 128;
const MAX_CODE_BLOCK_LENGTH = 12_000;

const extractCodeBlocks = (
  fileName: string,
  content: string,
  headings: readonly PositionedHeading[]
): DocCodeBlock[] => {
  const blocks: DocCodeBlock[] = [];
  const fencedRegex = /^```([^\n`]*)\n([\s\S]*?)^```[ \t]*$/gm;
  let match: RegExpExecArray | null;
  let headingIndex = -1;

  while (
    blocks.length < MAX_CODE_BLOCKS &&
    (match = fencedRegex.exec(content)) !== null
  ) {
    while (
      headingIndex + 1 < headings.length &&
      headings[headingIndex + 1].offset < match.index
    ) {
      headingIndex += 1;
    }

    const code = match[2].replace(/\n$/, '').slice(0, MAX_CODE_BLOCK_LENGTH);
    if (!code.trim()) continue;

    const info = match[1].trim().split(/\s+/, 1)[0];
    const nearestHeading = headings[headingIndex]?.heading;
    const fenceLine = content.slice(0, match.index).split('\n').length;

    blocks.push({
      id: `${fileName}-code-${blocks.length + 1}`,
      ...(info ? { language: info } : {}),
      code,
      ...(nearestHeading
        ? {
            headingId: nearestHeading.id,
            headingText: nearestHeading.text,
          }
        : {}),
      startLine: fenceLine + 1,
    });
  }

  return blocks;
};

const extractCodeContent = (content: string): string => {
  const codeBlocks: string[] = [];

  const fencedRegex = /```(?:\w+)?\n([\s\S]*?)```/g;
  let match;
  while ((match = fencedRegex.exec(content)) !== null) {
    const code = match[1].trim();
    if (code) codeBlocks.push(code);
  }

  const indentedRegex = /^( {4}|\t)([\s\S]*?)(?=\n[^ \t])/gm;
  while ((match = indentedRegex.exec(content)) !== null) {
    const code = match[2].replace(/^( {4}|\t)/gm, '').trim();
    if (code) codeBlocks.push(code);
  }

  const inlineRegex = /`([^`\n]{4,})`/g;
  while ((match = inlineRegex.exec(content)) !== null) {
    codeBlocks.push(match[1].trim());
  }

  return codeBlocks.join('\n\n').slice(0, 4000);
};

const extractPlainText = (content: string): string => {
  let cleaned = content;

  cleaned = cleaned.replace(/^---[\s\S]*?---\n?/, '');
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1 ');
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1 ');
  cleaned = cleaned.replace(/```[\s\S]*?```/g, ' ');
  cleaned = cleaned.replace(/^( {4}|\t)[\s\S]*?(?=\n[^ \t])/gm, ' ');
  cleaned = cleaned.replace(/`[^`]+`/g, ' ');
  cleaned = cleaned.replace(/^\|.*\|$/gm, ' ');
  cleaned = cleaned.replace(/^[ -|]+$/gm, ' ');
  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, ' ');
  cleaned = cleaned.replace(/^\s*\d+\.\s+/gm, ' ');
  cleaned = cleaned.replace(/^\s*>+\s?/gm, ' ');
  cleaned = cleaned.replace(/[*_~`]+/g, ' ');
  cleaned = cleaned.replace(/^\s*[-*_]{3,}\s*$/gm, ' ');
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  return cleaned.slice(0, 3000);
};

const isValidEntry = (
  title: string,
  text: string,
  codeContent: string,
  headings: DocHeading[]
): boolean => !!(title && (text || codeContent || headings.length > 0));

export const parseMarkdownContent = (
  filePath: string,
  content: string,
  lang: string = 'en'
): Option<DocEntry> => {
  const fileName = filePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
  if (!fileName) return none();

  const title = getOrElse(extractTitle(content, fileName), () => '');
  const positionedHeadings = extractPositionedHeadings(content);
  const headings = positionedHeadings.map(({ heading }) => heading);
  const text = extractPlainText(content);
  const codeContent = extractCodeContent(content);
  const codeBlocks = extractCodeBlocks(fileName, content, positionedHeadings);

  if (!isValidEntry(title, text, codeContent, headings)) return none();

  return some({
    id: fileName,
    title,
    text,
    codeContent,
    codeBlocks,
    path: `${lang}/${fileName}.md`,
    headings,
  });
};
