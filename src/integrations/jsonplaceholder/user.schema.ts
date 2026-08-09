import { z } from 'zod';

export const UserResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    email: z.email(),
  })
  .strip();

export type UserResponse = z.infer<typeof UserResponseSchema>;
