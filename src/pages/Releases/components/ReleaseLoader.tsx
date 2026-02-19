import { define } from '@effuse/core';

export const ReleaseLoader = define<{}, {}>({
  script: () => ({}),
  template: () => (
    <div class="flex flex-col items-center justify-center py-20 gap-4">
      <div class="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      <p class="text-white/40 animate-pulse">Fetching releases...</p>
    </div>
  ),
});
