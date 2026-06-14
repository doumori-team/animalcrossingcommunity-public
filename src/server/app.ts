import 'react-router';
import { createRequestHandler } from '@react-router/express';
import express, { Request } from 'express';
import { Judoscale, middleware as judoscaleMiddleware } from 'judoscale-express';

import apiRequests from './middleware/api-requests.ts';
import handleLoginLogout from './middleware/handle-login-logout.ts';
import paypal from './middleware/paypal.ts';
import sessionManagement from './middleware/session-management.ts';
import mailParse from './middleware/mail-parse.ts';
import rejectOrigin from './middleware/reject-origin.ts';
import recordIP from './middleware/record-ip.ts';
import { AppLoadContextType } from '@types';

declare module 'react-router'
{
	interface AppLoadContext extends AppLoadContextType
	{}
}

export const app = express();

if (!process.env.DATABASE_URL)
{
	throw new Error('DATABASE_URL is required');
}

process.on('unhandledRejection', (err) =>
{
	console.error('Error, Unhandled rejection:', err);
});

process.on('uncaughtException', (err) =>
{
	console.error('Error, Uncaught exception:', err);
});

app.use('/paypal', paypal);
app.use('/mail', mailParse);

app.use(judoscaleMiddleware(new Judoscale({
	api_base_url: process.env.JUDOSCALE_URL,
})));

app.set('trust proxy', 1);

app.use(sessionManagement);
app.use(rejectOrigin);
app.use(recordIP);
app.use('/auth', handleLoginLogout);
app.use('/api', apiRequests);

app.get('/health', async (req, res) =>
{
	res.status(200).send('ok');
});

app.use((req, res, next) =>
{
	// Skip static + special files (handled server.js)
	if (
		req.path.startsWith('/assets') ||
		req.path === '/robots.txt' ||
		req.path === '/ads.txt' ||
		req.path === '/favicon.ico' ||
		req.path.startsWith('/apple-touch-icon') ||
		req.path === '/acc_og-image.png'
	)
	{
		return next();
	}

	const hasSession = Boolean(req.session?.user);

	if (hasSession)
	{
		res.setHeader('Cache-Control', 'no-store');
	}
	else
	{
		res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=86400');
	}

	next();
});

app.use(
	createRequestHandler({
		// @ts-expect-error - virtual module provided by React Router at build time
		build: () => import('virtual:react-router/server-build'),
		getLoadContext(req: Request)
		{
			return {
				session: req.session ?? {
					user: null,
					username: null,
				},
				headers: req.headers,
				httpVersion: req.httpVersion,
				method: req.method,
				url: req.url,
				sessionID: req.sessionID,
			};
		},
	}),
);
