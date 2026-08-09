import { z } from 'zod';
import { LOCALES } from '../../../content/docs/constants.js';

export const TocEntrySchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  level: z.number().int().positive(),
});

/** Validates the public document payload returned by file-derived endpoints. */
export const DocumentSchema = z.strictObject({
  slug: z.string(),
  locale: z.enum(LOCALES),
  title: z.string(),
  content: z.string(),
  toc: z.array(TocEntrySchema).readonly(),
});

export const DocResponseSchema = DocumentSchema;

export type TocEntry = z.infer<typeof TocEntrySchema>;
export type Doc = z.infer<typeof DocumentSchema>;
