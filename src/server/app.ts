import 'react-router';
import { createRequestHandler } from '@react-router/express';
import express from 'express';
import cookieParser from 'cookie-parser';
import { Judoscale, middleware as judoscaleMiddleware } from 'judoscale-express';

import apiRequests from './middleware/api-requests.ts';
import handleLoginLogout from './middleware/handle-login-logout.ts';
import paypal from './middleware/paypal.ts';
import sessionManagement from './middleware/session-management.ts';
import mailParse from './middleware/mail-parse.ts';
import rejectOrigin from './middleware/reject-origin.ts';
import signedInForever from './middleware/signed-in-forever.ts';
import recordIP from './middleware/record-ip.ts';
import { AppLoadContextType } from '@types';

declare module 'react-router'
{
	interface AppLoadContext extends AppLoadContextType
	{}
}

export const app = express();

app.use('/paypal', paypal);

app.use(cookieParser());                        // Self-explanatory; used for Signed In Forever Middleware
app.use(judoscaleMiddleware(new Judoscale({
	api_base_url: process.env.JUDOSCALE_URL,
})));

app.use('/mail', mailParse);
app.use(sessionManagement);
app.use(rejectOrigin);
app.use(signedInForever);
app.use(recordIP);
app.use('/auth', handleLoginLogout);
app.use('/api', apiRequests);

app.use(
	createRequestHandler({
		// @ts-expect-error - virtual module provided by React Router at build time
		build: () => import('virtual:react-router/server-build'),
		getLoadContext(req: any)
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
			};
		},
	}),
);
