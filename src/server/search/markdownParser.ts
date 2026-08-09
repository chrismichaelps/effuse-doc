import { compileDocumentSource } from '../docs/documentCompiler.js';
import { none, some, type Option } from '../../utils/data/index.js';
import type { DocEntry } from './document.types.js';

export type { DocCodeBlock, DocEntry, DocHeading } from './document.types.js';

/**
 * Preserves the parser API for focused tests and external indexing tools while
 * delegating structural parsing to the document compiler.
 */
export const parseMarkdownContent = (
  filePath: string,
  content: string,
  locale: string = 'en'
): Option<DocEntry> => {
  const slug = filePath.split('/').pop()?.replace(/\.md$/, '') ?? '';
  if (!slug) return none();

  try {
    const entry = compileDocumentSource(content, {
      slug,
      locale,
      filePath: `${locale}/${slug}.md`,
    }).searchEntry;

    return entry.title &&
      (entry.text || entry.codeContent || entry.headings.length > 0)
      ? some(entry)
      : none();
  } catch {
    return none();
  }
};
