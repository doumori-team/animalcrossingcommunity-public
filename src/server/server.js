import express from 'express';
import * as Sentry from '@sentry/node';

import { createServer } from 'http';
import https from 'https';
import path from 'path';

import { initWebSocket } from './notificationService.ts';

if (process.env.SENTRY_DSN)
{
	Sentry.init({
		dsn: process.env.SENTRY_DSN,
		sendDefaultPii: false,
		tracesSampler: (samplingContext) =>
		{
			const name = samplingContext.name || '';

			if (name.includes('forums'))
			{
				return 1.0;
			}

			return 0.05;
		},
		integrations: [
			Sentry.consoleLoggingIntegration({ levels: ['warn', 'error', 'info'] }),
			Sentry.expressIntegration(),
		],
		enableLogs: true,
		environment: process.env.NODE_ENV,
	});
}

const app = express();

const PORT = process.env.PORT || 3000;

if (process.env.APP_NAME === 'acc-local')
{
	console.log('Starting local server');
	const viteDevServer = await import('vite').then((vite) =>
		vite.createServer({
			server: {
				middlewareMode: true,
				watch: {
					usePolling: true,
					interval: 1000,
				},
			},
		}),
	);
	app.use(viteDevServer.middlewares);
	app.use(async (req, res, next) =>
	{
		try
		{
			const source = await viteDevServer.ssrLoadModule('./src/server/app.ts');
			return await source.app(req, res, next);
		}
		catch (error)
		{
			if (typeof error === 'object' && error instanceof Error)
			{
				viteDevServer.ssrFixStacktrace(error);
			}
			next(error);
		}
	});
}
else
{
	app.use((req, res, next) =>
	{
		if (process.env.MAINTENANCE_MODE === 'true')
		{
			if (req.path === '/health') return next();

			res.status(503);
			res.set('Content-Type', 'text/html');
			res.set('Retry-After', '3600');

			https.get(
				process.env.MAINTENANCE_PAGE_URL,
				(s3Res) =>
				{
					s3Res.pipe(res);
				},
			).on('error', () =>
			{
				res.end('Maintenance');
			});

			return;
		}

		next();
	});

	app.use((req, res, next) =>
	{
		if (req.hostname === 'financial.animalcrossingcommunity.com')
		{
			return res.sendFile('index.html', {
				root: path.resolve('financial'),
			});
		}

		next();
	});

	console.log(`Starting ${process.env.NODE_ENV} server`);
	app.use(
		'/assets',
		express.static('build/client/assets', {
			maxAge: '1y',
			immutable: true,
		}),
	);
	app.use(
		express.static('build/client', {
			maxAge: '0',
			setHeaders(res, filePath)
			{
				const fileName = path.basename(filePath);

				if (
					fileName === 'robots.txt' ||
					fileName === 'ads.txt' ||
					fileName === 'favicon.ico' ||
					fileName.startsWith('apple-touch-icon') ||
					fileName === 'acc_og-image.png'
				)
				{
					res.setHeader('Cache-Control', 'public, max-age=86400');
				}
			},
		}),
	);

	const mainApp = await import('./app.ts').then(mod => mod.app);

	app.use((req, res, next) =>
	{
		if (req.hostname === 'financial.animalcrossingcommunity.com')
		{
			return next();
		}

		return mainApp(req, res, next);
	});

	if (process.env.SENTRY_DSN)
	{
		Sentry.setupExpressErrorHandler(app);
	}
}

const server = createServer(app);

initWebSocket(server);

server.listen(PORT, '0.0.0.0', () =>
{
	console.info(`ACC is running on port ${PORT}`);
});
