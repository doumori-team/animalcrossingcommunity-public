import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
	test: {
		globals: true,
		environmentMatchGlobs: [
			['tests/common/**', 'jsdom'],
			['tests/server/**', 'node'],
		],
		setupFiles: ['./tests/vitest.setup.ts'],
		sequence: {
			shuffle: true,
		},
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'lcov', 'html'],
			all: false,
			include: ['src/server/api/**/*.{ts,js,tsx,jsx}', 'src/common/components/**/*.{ts,js,tsx,jsx}'],
			exclude: ['**/node_modules/**', '**/tests/**'],
		},
	},
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
			'tests': path.resolve(__dirname, 'tests'),
		},
	},
});