import { parseSync } from '@effuse/ink';
import type {
  BlockNode,
  DocumentNode,
  InlineNode,
  MarkdownNode,
} from '@effuse/ink';
import type { TocEntry } from '../../domains/docs/contracts/document.schema.js';
import type {
  DocCodeBlock,
  DocEntry,
  DocHeading,
} from '../search/document.types.js';
import { createHeadingSlugger } from './slug.js';

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const TITLE_FIELD = /^title:\s*(.+)$/m;
const MAX_CODE_BLOCKS = 128;
const MAX_CODE_BLOCK_LENGTH = 12_000;
const MAX_CODE_CONTENT_LENGTH = 4_000;
const MAX_PLAIN_TEXT_LENGTH = 3_000;

interface ParsedSource {
  readonly frontmatter: string | null;
  readonly body: string;
}

export interface CompiledDocumentSource {
  readonly title: string;
  readonly content: string;
  readonly toc: readonly TocEntry[];
  readonly searchEntry: DocEntry;
}

export interface CompileDocumentOptions {
  readonly slug: string;
  readonly locale: string;
  readonly filePath?: string;
}

const splitFrontmatter = (markdown: string): ParsedSource => {
  const match = FRONTMATTER.exec(markdown);
  if (!match) return { frontmatter: null, body: markdown };
  return { frontmatter: match[1], body: markdown.slice(match[0].length) };
};

const humanizeSlug = (slug: string): string =>
  slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());

const inlineText = (nodes: readonly InlineNode[]): string =>
  nodes
    .map((node) => {
      switch (node._tag) {
        case 'Text':
        case 'InlineCode':
          return node.value;
        case 'Emphasis':
        case 'Link':
          return inlineText(node.children);
        case 'Image':
          return node.alt;
        case 'LineBreak':
          return '\n';
        case 'InlineComponent':
          return markdownText(node.children);
      }
    })
    .join('');

const inlineProseText = (nodes: readonly InlineNode[]): string =>
  nodes
    .map((node) => {
      switch (node._tag) {
        case 'Text':
          return node.value;
        case 'InlineCode':
          return '';
        case 'Emphasis':
        case 'Link':
          return inlineProseText(node.children);
        case 'Image':
          return node.alt;
        case 'LineBreak':
          return '\n';
        case 'InlineComponent':
          return markdownText(node.children);
      }
    })
    .join('');

type TableRow = Extract<MarkdownNode, { readonly _tag: 'TableRow' }>;

const rowText = (row: TableRow): string =>
  row.cells.map((cell) => inlineText(cell.children)).join(' ');

const blockText = (node: BlockNode): string => {
  switch (node._tag) {
    case 'Heading':
    case 'Paragraph':
      return inlineProseText(node.children);
    case 'Blockquote':
      return node.children.map(blockText).join(' ');
    case 'List':
      return node.children
        .flatMap((item) => item.children)
        .map(blockText)
        .join(' ');
    case 'Table':
      return [rowText(node.header), ...node.rows.map(rowText)].join(' ');
    case 'Component':
      return markdownText(node.children);
    case 'CodeBlock':
    case 'HorizontalRule':
      return '';
  }
};

const markdownNodeText = (node: MarkdownNode): string => {
  if (node._tag === 'ListItem') {
    return node.children.map(blockText).join(' ');
  }
  if (node._tag === 'TableRow') return rowText(node);
  if (node._tag === 'TableCell') return inlineText(node.children);
  if (
    node._tag === 'Text' ||
    node._tag === 'InlineCode' ||
    node._tag === 'Emphasis' ||
    node._tag === 'Link' ||
    node._tag === 'Image' ||
    node._tag === 'LineBreak' ||
    node._tag === 'InlineComponent'
  ) {
    return inlineProseText([node]);
  }
  return blockText(node);
};

function markdownText(nodes: readonly MarkdownNode[]): string {
  return nodes.map(markdownNodeText).join(' ');
}

const walkMarkdown = (
  nodes: readonly MarkdownNode[],
  visit: (node: MarkdownNode) => void
): void => {
  for (const node of nodes) {
    visit(node);

    switch (node._tag) {
      case 'Emphasis':
      case 'Link':
      case 'Paragraph':
      case 'Heading':
      case 'TableCell':
        walkMarkdown(node.children, visit);
        break;
      case 'InlineComponent':
      case 'Component':
        walkMarkdown(node.children, visit);
        Object.values(node.slots).forEach((slot) => walkMarkdown(slot, visit));
        break;
      case 'Blockquote':
      case 'ListItem':
        walkMarkdown(node.children, visit);
        break;
      case 'List':
        walkMarkdown(node.children, visit);
        break;
      case 'Table':
        walkMarkdown([node.header, ...node.rows], visit);
        break;
      case 'TableRow':
        walkMarkdown(node.cells, visit);
        break;
      case 'Text':
      case 'InlineCode':
      case 'Image':
      case 'LineBreak':
      case 'CodeBlock':
      case 'HorizontalRule':
        break;
    }
  }
};

const extractSearchableCode = (content: string): string => {
  const snippets: string[] = [];
  let match: RegExpExecArray | null;

  const fenced = /```(?:\w+)?\n([\s\S]*?)```/g;
  while ((match = fenced.exec(content)) !== null) {
    const code = match[1].trim();
    if (code) snippets.push(code);
  }

  const indented = /^( {4}|\t)([\s\S]*?)(?=\n[^ \t])/gm;
  while ((match = indented.exec(content)) !== null) {
    const code = match[2].replace(/^( {4}|\t)/gm, '').trim();
    if (code) snippets.push(code);
  }

  const inline = /`([^`\n]{4,})`/g;
  while ((match = inline.exec(content)) !== null) {
    snippets.push(match[1].trim());
  }

  return snippets.join('\n\n').slice(0, MAX_CODE_CONTENT_LENGTH);
};

// Full-text normalization remains source-based because custom Ink nodes may
// intentionally omit prose from their structural children.
const extractSearchableProse = (content: string): string =>
  content
    .replace(/^---[\s\S]*?---\n?/, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1 ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1 ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/^( {4}|\t)[\s\S]*?(?=\n[^ \t])/gm, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/^\|.*\|$/gm, ' ')
    .replace(/^\s*\|?\s*:?-{3,}:?\s*(?:\|\s*:?-{3,}:?\s*)+\|?\s*$/gm, ' ')
    .replace(/^\s*[-*+]\s+/gm, ' ')
    .replace(/^\s*\d+\.\s+/gm, ' ')
    .replace(/^\s*>+\s?/gm, ' ')
    .replace(/[*_~`]+/g, ' ')
    .replace(/^\s*[-*_]{3,}\s*$/gm, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_PLAIN_TEXT_LENGTH);

const resolveTitle = (
  source: ParsedSource,
  ast: DocumentNode,
  slug: string
): string => {
  const frontmatterTitle = source.frontmatter
    ? TITLE_FIELD.exec(source.frontmatter)?.[1]?.trim()
    : undefined;
  if (frontmatterTitle) return frontmatterTitle;

  const h1 = ast.children.find(
    (node): node is Extract<BlockNode, { readonly _tag: 'Heading' }> =>
      node._tag === 'Heading' && node.level === 1
  );
  return h1?.children ? inlineText(h1.children).trim() : humanizeSlug(slug);
};

const compileAst = (
  ast: DocumentNode,
  slug: string
): {
  toc: readonly TocEntry[];
  headings: readonly DocHeading[];
  codeBlocks: readonly DocCodeBlock[];
} => {
  const slugger = createHeadingSlugger();
  const toc: TocEntry[] = [];
  const headings: DocHeading[] = [];
  const codeBlocks: DocCodeBlock[] = [];
  let nearestHeading: DocHeading | undefined;

  walkMarkdown(ast.children, (node) => {
    if (node._tag === 'Heading') {
      const text = inlineText(node.children).trim();
      const heading = { text, id: slugger.next(text), level: node.level };
      headings.push(heading);
      nearestHeading = heading;
      if (node.level <= 3) {
        toc.push({ id: heading.id, title: heading.text, level: heading.level });
      }
      return;
    }

    if (node._tag === 'CodeBlock') {
      if (codeBlocks.length < MAX_CODE_BLOCKS && node.code.trim().length > 0) {
        const language = node.language?.trim().split(/\s+/, 1)[0];
        codeBlocks.push({
          id: `${slug}-code-${codeBlocks.length + 1}`,
          ...(language ? { language } : {}),
          code: node.code.replace(/\n$/, '').slice(0, MAX_CODE_BLOCK_LENGTH),
          ...(nearestHeading
            ? {
                headingId: nearestHeading.id,
                headingText: nearestHeading.text,
              }
            : {}),
          startLine: (node.position?.start.line ?? 0) + 1,
        });
      }
    }
  });

  return {
    toc,
    headings,
    codeBlocks,
  };
};

/**
 * Compiles delivery, navigation, and search projections from one Ink AST so
 * heading identity cannot drift between server features.
 */
export const compileDocumentSource = (
  raw: string,
  options: CompileDocumentOptions
): CompiledDocumentSource => {
  const source = splitFrontmatter(raw);
  const content = source.body.trim();
  const ast = parseSync(content);
  const compiled = compileAst(ast, options.slug);
  const title = resolveTitle(source, ast, options.slug);

  return {
    title,
    content,
    toc: compiled.toc,
    searchEntry: {
      id: options.slug,
      title,
      text: extractSearchableProse(content),
      codeContent: extractSearchableCode(content),
      codeBlocks: compiled.codeBlocks,
      path: options.filePath ?? `${options.locale}/${options.slug}.md`,
      headings: compiled.headings,
    },
  };
};
