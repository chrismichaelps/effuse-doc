import { createStore, connectDevTools } from '@effuse/store';
import { taggedEnum, tryCatchAsync, matchEither } from '../utils/data/index.js';
import { ReleasesError } from '../errors/index.js';

const STORE_NAME = 'release';
const GITHUB_API_URL =
  'https://api.github.com/repos/chrismichaelps/effuse/releases';

export interface GitHubRelease {
  id: number;
  name: string;
  tag_name: string;
  body: string;
  published_at: string;
  html_url: string;
  author: {
    login: string;
    avatar_url: string;
  };
}

export type ReleaseStatus =
  | { readonly _tag: 'Idle' }
  | { readonly _tag: 'Loading' }
  | { readonly _tag: 'Success'; readonly releases: GitHubRelease[] }
  | { readonly _tag: 'Error'; readonly error: ReleasesError };

const ReleaseStatusState = taggedEnum<ReleaseStatus>();

interface ReleaseState {
  status: ReleaseStatus;
}

interface ReleaseActions {
  fetchReleases: () => Promise<void>;
  init: () => void;
}

export const releaseStore = createStore<ReleaseState & ReleaseActions>(
  STORE_NAME,
  {
    status: ReleaseStatusState.Idle({}),

    async fetchReleases() {
      if (ReleaseStatusState.$is('Loading')(this.status.value)) {
        return;
      }

      this.status.value = ReleaseStatusState.Loading({});

      const result = await tryCatchAsync(
        async () => {
          const response = await fetch(GITHUB_API_URL);
          if (!response.ok) {
            throw new ReleasesError({
              message: `Failed to fetch releases: ${response.statusText}`,
              statusCode: response.status,
            });
          }
          return (await response.json()) as GitHubRelease[];
        },
        (err) =>
          err instanceof ReleasesError
            ? err
            : new ReleasesError({
                message: err instanceof Error ? err.message : 'Unknown error',
              })
      );

      matchEither(result, {
        onLeft: (error) => {
          this.status.value = ReleaseStatusState.Error({ error });
        },
        onRight: (releases) => {
          this.status.value = ReleaseStatusState.Success({ releases });
        },
      });
    },

    init() {
      this.fetchReleases();
    },
  },
  { devtools: true }
);

connectDevTools(releaseStore);

export type ReleaseStore = typeof releaseStore;
