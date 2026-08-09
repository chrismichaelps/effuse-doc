import {
  GitHubReleasesResponseSchema,
  type GitHubRelease,
} from './github-release.schema.js';

export const decodeGitHubReleasesResponse = (
  payload: unknown
): GitHubRelease[] => GitHubReleasesResponseSchema.parse(payload);
