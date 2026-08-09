import { z } from 'zod';

export const TodoResponseSchema = z.strictObject({
  id: z.number().int(),
  userId: z.number().int(),
  title: z.string(),
  completed: z.boolean(),
});

export const TodosResponseSchema = z.array(TodoResponseSchema);

export const PostResponseSchema = z.strictObject({
  id: z.number().int(),
  userId: z.number().int(),
  title: z.string(),
  body: z.string(),
});

export const UserResponseSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    email: z.email(),
  })
  .strip();

const GitHubReleaseSchema = z
  .object({
    id: z.number().int(),
    name: z
      .string()
      .nullable()
      .transform((value) => value ?? ''),
    tag_name: z.string(),
    body: z
      .string()
      .nullable()
      .transform((value) => value ?? ''),
    published_at: z
      .string()
      .nullable()
      .transform((value) => value ?? ''),
    html_url: z.url(),
    author: z
      .object({
        login: z.string(),
        avatar_url: z.url(),
      })
      .strip(),
  })
  .strip();

export const GitHubReleasesResponseSchema = z.array(GitHubReleaseSchema);
