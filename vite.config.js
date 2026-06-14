import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from 'vite';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ isSsrBuild, mode }) =>
{
	const isProdOrStaging = mode === 'production' || mode === 'staging';
	const isProd = mode === 'production';

	return {
		plugins: [
			reactRouter(),
			VitePWA({
				registerType: 'autoUpdate',
				srcDir: path.resolve(__dirname, 'src/client/'),
				filename: 'service-worker.js',
				strategies: 'injectManifest',
				injectManifest: {
					maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
				},
				manifest: {
					name: 'Animal Crossing Community',
					short_name: 'ACC',
					start_url: '/',
					display: 'standalone',
					background_color: '#ffffff',
					theme_color: '#5a3e05',
					icons: [
						{
							src: 'apple-touch-icon-192x192.png',
							sizes: '192x192',
							type: 'image/png'
						},
						{
							src: 'apple-touch-icon-512x512.png',
							sizes: '512x512',
							type: 'image/png'
						},
					],
				},
			}),
		],
		resolve: {
			alias: {
				'client': path.resolve(__dirname, 'src/client'),
				'common': path.resolve(__dirname, 'src/common'),
				'server': path.resolve(__dirname, 'src/server'),
				'@/components': path.resolve(__dirname, 'src/common/components'),
				'@/pages': path.resolve(__dirname, 'src/common/components/pages'),
				'@accounts': path.resolve(__dirname, 'src/server/accounts.ts'),
				'@behavior': path.resolve(__dirname, 'src/common/components/behavior/index.ts'),
				'@contexts': path.resolve(__dirname, 'src/common/contexts.ts'),
				'@db': path.resolve(__dirname, 'src/server/db.ts'),
				'@errors': path.resolve(__dirname, 'src/common/errors.ts'),
				'@form': path.resolve(__dirname, 'src/common/components/form/index.ts'),
				'@layout': path.resolve(__dirname, 'src/common/components/layout/index.ts'),
				'@types': path.resolve(__dirname, 'src/common/types/index.ts'),
				'@utils': path.resolve(__dirname, 'src/common/utils/index.ts'),
				'@apiTypes': path.resolve(__dirname, 'src/server/api-types.ts'),
				'@apiPerms': path.resolve(__dirname, 'src/server/api-permissions.ts'),
				'@cache': path.resolve(__dirname, 'src/server/cache.ts'),
				'@hooks': path.resolve(__dirname, 'src/common/hooks/index.ts'),
			},
		},
		publicDir: 'src/client/static',
		build: {
			target: 'esnext', // need for top-level awaits (data.js, etc.)
			minify: isProdOrStaging ? (isSsrBuild ? false : 'terser') : false,
			sourcemap: isProdOrStaging ? isSsrBuild : true,
			rollupOptions: {
				...(isSsrBuild ? {
					input: {
						app: './src/server/app.ts',
						server: './src/server/server.js',
					},
					external: isProd ? (id) => id.includes('api/v1/automation/') : [],
				} : {}),
				output: {
					assetFileNames: (assetInfo) => {
						const original =
						assetInfo.originalFileNames?.[0] ?? '';

						const normalized = original.replace(/\\/g, '/');

						const marker = 'src/client/images/';
						const index = normalized.indexOf(marker);

						if (index !== -1) {
							const relative = normalized.slice(index + marker.length);

							const ext = path.posix.extname(relative);
							const base = relative.slice(0, -ext.length);

							return `assets/${base}-[hash]${ext}`;
						}

						return 'assets/[name]-[hash][extname]';
					},
				},
			},
		},
	};
});