import { z } from 'zod';

export const PostResponseSchema = z.strictObject({
  id: z.number().int(),
  userId: z.number().int(),
  title: z.string(),
  body: z.string(),
});

export type PostResponse = z.infer<typeof PostResponseSchema>;
