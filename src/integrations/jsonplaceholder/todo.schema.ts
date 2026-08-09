import { z } from 'zod';

export const TodoResponseSchema = z.strictObject({
  id: z.number().int(),
  userId: z.number().int(),
  title: z.string(),
  completed: z.boolean(),
});

export const TodosResponseSchema = z.array(TodoResponseSchema);

export type TodoResponse = z.infer<typeof TodoResponseSchema>;
