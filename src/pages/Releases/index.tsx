import { define, useHead, computed } from '@effuse/core';
import { DocsLayout } from '../../components/docs/DocsLayout.js';
import { releaseStore, type ReleaseStatus } from '../../store/releaseStore.js';
import { matchTag } from '../../utils/data/index.js';
import { ReleaseLoader } from './components/ReleaseLoader.js';
import { ReleaseError } from './components/ReleaseError.js';
import { ReleaseList } from './components/ReleaseList.js';

export const ReleasesPage = define({
  script: ({ onMount }) => {
    useHead({
      title: 'Releases - Effuse Docs',
      description:
        'Check out the latest releases and updates for the Effuse framework.',
    });

    onMount(() => {
      releaseStore.init();
      return undefined;
    });

    const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    return {
      status: releaseStore.status,
      formatDate,
      fetchReleases: () => releaseStore.fetchReleases(),
    };
  },
  template: ({ status, formatDate, fetchReleases }) => (
    <DocsLayout currentPath="/releases" pageTitle="Releases">
      <div class="releases-container animate-water-drop">
        <header class="mb-12">
          <h1 class="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            Releases
          </h1>
          <p class="text-white/60 mt-2">
            The latest updates and improvements to Effuse.
          </p>
        </header>

        {computed(() =>
          matchTag<ReleaseStatus, any>(status.value, {
            Idle: () => <ReleaseLoader />,
            Loading: () => <ReleaseLoader />,
            Error: ({ error }) => (
              <ReleaseError message={error.message} onRetry={fetchReleases} />
            ),
            Success: ({ releases: r }) => (
              <ReleaseList releases={r} formatDate={formatDate} />
            ),
            _: () => null,
          })
        )}
      </div>
    </DocsLayout>
  ),
});
