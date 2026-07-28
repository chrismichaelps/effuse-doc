import { defineConfig } from 'vite';
import { effuse } from '@effuse/compiler/vite';
import tailwindcss from '@tailwindcss/vite';
import { effuseDevApi } from './src/server/dev-middleware';

/**
 * Two outputs from one config, selected by `--ssr`:
 *
 *   dist/client   browser bundle, index.html shell, and the asset manifest
 *   dist/server   entry-server.js, imported by api/ and scripts/serve.mjs
 */
export default defineConfig(({ isSsrBuild }) => ({
  plugins: [tailwindcss(), effuse({ debug: false }), effuseDevApi()],
  ssr: {
    noExternal: ['gsap', 'lenis'],
  },
  resolve: {
    dedupe: [
      '@effuse/core',
      '@effuse/store',
      '@effuse/router',
      '@effuse/query',
      '@effuse/i18n',
    ],
  },
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 1000,
    outDir: isSsrBuild ? 'dist/server' : 'dist/client',
    emptyOutDir: true,
    // The handler needs the manifest to emit asset tags matching the hashed
    // filenames the client build produced.
    manifest: !isSsrBuild,
    rollupOptions: {
      output: isSsrBuild
        ? {}
        : {
            manualChunks(id: string) {
              if (id.includes('node_modules') && id.includes('effect')) {
                return 'vendor-effect';
              }
              return undefined;
            },
          },
    },
  },
}));
