import { z } from 'zod';

export const GitHubReleaseSchema = z
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

export type GitHubRelease = z.infer<typeof GitHubReleaseSchema>;
