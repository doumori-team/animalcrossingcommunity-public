import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, loadEnv } from 'vite';
import path from 'path';

export default defineConfig(({ isSsrBuild, mode }) =>
{
	// see ci/build.sh; also used for staging
	const isProdOrStaging = mode === 'production' || mode === 'staging';
	const isProd = mode === 'production';

	const env = loadEnv(mode, process.cwd(), '');

	return {
		plugins: [
			reactRouter(),
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
				'@cache': path.resolve(__dirname, 'src/server/cache.ts'),
			},
		},
		publicDir: 'src/client/static',
		build: {
			target: 'esnext', // need for top-level awaits (data.js, etc.)
			minify: isProdOrStaging ? 'terser' : false,
			sourcemap: !isProdOrStaging,
			rollupOptions: isSsrBuild ? {
				input: './src/server/app.ts',
				external: isProd ? (id) => id.includes('api/v1/automation/') : [],
			} : {
				external: isProd ? (id) => id.includes('api/v1/automation/') : [],
			},
		},
		define: {
			'process.env.NODE_ENV': JSON.stringify(mode),
			'process.env.HEROKU_APP_NAME': JSON.stringify(env.HEROKU_APP_NAME),
			'process.env.PAYPAL_CLIENT_ID': JSON.stringify(env.PAYPAL_CLIENT_ID),
		},
	};
});