import { defineConfig } from 'vite';
import { effuse } from '@effuse/compiler/vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
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
