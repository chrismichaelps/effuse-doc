import { define, computed } from '@effuse/core';
import { triggerHaptic } from '../../../components/Haptics/index.js';

interface ReleaseErrorProps {
  message: string;
  onRetry: () => void;
}

export const ReleaseError = define<ReleaseErrorProps, any>({
  script: ({ props }) => props,
  template: ({ message, onRetry }) => (
    <div class="p-8 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
      <p class="text-red-400 font-medium">Failed to load releases</p>
      <p class="text-red-400/60 text-sm mt-1">
        {computed(() => message.value)}
      </p>
      <button
        onClick={() => {
          triggerHaptic('medium');
          onRetry.value();
        }}
        class="mt-4 px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors text-sm font-medium"
      >
        Retry Fetch
      </button>
    </div>
  ),
});
