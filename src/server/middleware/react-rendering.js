import React from 'react';
import { URL } from 'url';
import express from 'express';
import ReactDOMServer from 'react-dom/server';
import { createStaticHandler, StaticRouterProvider, createStaticRouter } from 'react-router-dom/server';

import routes from 'common/routes.js';
import * as iso from 'common/iso.js';
import { getSeason } from 'common/calendar.js';
import { constants } from '@utils';

const app = express();
app.set('views', new URL('../views', import.meta.url).pathname);

const handler = createStaticHandler(routes);

/* Express route for handling GET requests.
 *
 * First matches the URL against the paths defined in routes.js, redirecting
 * or returning a 404 as necessary. If the URL resolves to a React component,
 * initially renders it server-side before passing control to the client-side.
 *
 * If data is fetched from the database, it is also serialized and passed to
 * the client-side as window.__initialData.
 */
app.get('*', async (request, response) =>
{
	let clientRequest = createFetchRequest(request);

	// when rendering server-side, send authenticated user to routing's loader functions
	clientRequest.session = {};
	clientRequest.session.user = request.session.user;

	const context = await handler.query(clientRequest);

	if (
		context instanceof Response &&
		[301, 302, 303, 307, 308].includes(context.status)
	)
	{
		return response.redirect(
			context.status,
			context.headers.get('Location')
		);
	}

	// 400s, 500s
	if (context.errors)
	{
		const error = context.errors['0'];
		const status = error.status ? error.status : 500;

		response.status(status);

		if (status === 500)
		{
			console.error('Logging error response:');
			console.error(error);
		}

		return response.render(status === 404 ? '404' : '500');
	}

	const markup = ReactDOMServer.renderToString(
		<StaticRouterProvider
			router={createStaticRouter(
				handler.dataRoutes,
				context
			)}
			context={context}
		/>
	);

	const searchParams = new URLSearchParams(context.location.search);

	let query = {};

	for (const [key, value] of searchParams.entries())
	{
		query[key] = value;
	}

	// update session
	if (request.session.user)
	{
		const params = context.matches.find(m => m.pathname === context.location.pathname)?.params;

		iso.query(request.session.user, 'v1/session/update', {
			url: context.location.pathname,
			params: params,
			query: query
		});
	}

	// figure out favicon
	let icon = '/images/layout/favicon/';

	if (constants.LIVE_SITE || query.debug)
	{
		const {season} = getSeason(constants.LIVE_SITE ? null: query.debug);

		icon += `gyroid-${season}.ico`;
	}
	else
	{
		icon += 'gyroid-test.ico';
	}

	const title = await iso.query(request.session.user, 'v1/title', {
		pathname: context.location.pathname
	});

	return response.render('index', {
		markup,
		icon,
		version: constants.version,
		title
	});
});

// From React-Router 6 docs
function createFetchRequest(req)
{
	let origin = `${req.protocol}://${req.get("host")}`;
	let url;

	try
	{
		url = new URL(req.originalUrl || req.url, origin);
	}
	catch (e)
	{
		url = new URL('', origin);
	}

	let controller = new AbortController();
	req.on("close", () => controller.abort());

	let headers = new Headers();

	for (let [key, values] of Object.entries(req.headers))
	{
		if (values)
		{
			if (Array.isArray(values))
			{
				for (let value of values)
				{
					headers.append(key, value);
				}
			}
			else
			{
				headers.set(key, values);
			}
		}
	}

	let init = {
		method: req.method,
		headers,
		signal: controller.signal,
	};

	if (req.method !== "GET" && req.method !== "HEAD")
	{
		init.body = req.body;
	}

	return new Request(url.href, init);
};

export default app;
