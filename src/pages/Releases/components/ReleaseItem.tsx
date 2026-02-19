import { define, computed } from '@effuse/core';
import { Ink } from '@effuse/ink';
import type { GitHubRelease } from '../../../store/releaseStore.js';

interface ReleaseItemProps {
  release: GitHubRelease;
  formatDate: (date: string) => string;
}

export const ReleaseItem = define<ReleaseItemProps, any>({
  script: ({ props }) => props,
  template: ({ release, formatDate }) => {
    const r = release() as GitHubRelease;
    if (!r || !r.name) {
      return null;
    }

    const bodyContent = r.body || '';

    return (
      <article class="release-item group">
        <div class="flex flex-wrap items-baseline justify-between gap-4 mb-6">
          <div class="flex items-center gap-4">
            <h2 class="text-2xl font-bold group-hover:text-accent-mint transition-colors">
              {r.name || r.tag_name}
            </h2>
            <span class="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-white/50">
              {r.tag_name}
            </span>
          </div>
          <time class="text-sm text-white/40 font-medium">
            {computed(() => formatDate(r.published_at))}
          </time>
        </div>

        <div class="prose prose-invert prose-slate max-w-none bg-white/[0.02] border border-white/5 rounded-2xl p-8 hover:border-white/10 transition-colors">
          <Ink content={bodyContent} />
        </div>

        <div class="mt-6 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <img
              src={r.author?.avatar_url}
              alt={r.author?.login}
              class="w-6 h-6 rounded-full border border-white/10"
            />
            <span class="text-sm text-white/40">
              Released by{' '}
              <span class="text-white/60 font-medium">{r.author?.login}</span>
            </span>
          </div>
          <a
            href={r.html_url}
            target="_blank"
            rel="noopener noreferrer"
            class="text-sm text-accent-mint/60 hover:text-accent-mint transition-colors flex items-center gap-2"
          >
            View on GitHub
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
      </article>
    );
  },
});
