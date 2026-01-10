import { defineConfig } from 'vite';
import path from 'path';
import { effuse } from '@effuse/compiler/vite';
import pkg from './package.json';

import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	define: {
		__APP_VERSION__: JSON.stringify(pkg.version),
	},
	plugins: [
		tailwindcss(),
		effuse({
			debug: false,
		}),
	],
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
		rollupOptions: {
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						if (id.includes('effect')) {
							return 'vendor-effect';
						}
					}
				},
			},
		},
	},
});
