import { define, type ReadonlySignal, For } from '@effuse/core';
import type { GitHubRelease } from '../../../store/releaseStore.js';
import { ReleaseItem } from './ReleaseItem.js';

interface ReleaseListProps {
  releases: GitHubRelease[];
  formatDate: (date: string) => string;
}

export const ReleaseList = define<ReleaseListProps, any>({
  script: ({ props }) => props,
  template: ({ releases, formatDate }) => {
    return (
      <div class="space-y-16">
        <For each={() => releases} keyExtractor={(r: GitHubRelease) => r.id}>
          {(item: ReadonlySignal<GitHubRelease>) => (
            <ReleaseItem release={item.value} formatDate={formatDate} />
          )}
        </For>
      </div>
    );
  },
});
