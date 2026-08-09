import { define } from '@effuse/core';
import { QueryClientProvider } from '@effuse/query';
import { RouterView } from '@effuse/router';
import { AppLayout } from './layers/AppLayout.js';
import { SmoothScroll } from './components/SmoothScroll';
import { queryClient } from './store/queryClient.js';

export const App = define({
  script: ({}) => ({}),
  template: () => (
    <QueryClientProvider client={queryClient}>
      <AppLayout>
        <SmoothScroll />
        <RouterView />
      </AppLayout>
    </QueryClientProvider>
  ),
});
