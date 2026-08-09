import { z } from 'zod';
import { LOCALES } from '../../content/docs/constants.js';

const TocEntrySchema = z.strictObject({
  id: z.string(),
  title: z.string(),
  level: z.number().int().positive(),
});

export const DocResponseSchema = z.strictObject({
  slug: z.string(),
  locale: z.enum(LOCALES),
  title: z.string(),
  content: z.string(),
  toc: z.array(TocEntrySchema).readonly(),
});
