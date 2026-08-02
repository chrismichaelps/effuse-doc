import { define } from '@effuse/core';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

export const AppLayout = define({
  script: () => ({}),
  template: ({ children }) => (
    <div class="docs-layout-container min-h-screen flex flex-col">
      <Header />
      <main class="flex-1">{children}</main>
      <Footer />
    </div>
  ),
});
