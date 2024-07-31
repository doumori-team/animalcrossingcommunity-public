import React from 'react';
import { URL } from 'url';
import express from 'express';
import ReactDOMServer from 'react-dom/server';
import { createStaticHandler, StaticRouterProvider, createStaticRouter, StaticHandlerContext } from 'react-router-dom/server.js';

import routes from 'common/routes.ts';
import * as iso from 'common/iso.js';
import { getSeason } from 'common/calendar.ts';
import { constants, utils } from '@utils';
import * as errors from 'common/errors.ts';
import * as db from '@db';

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
app.get('*', async (request:any, response:any) =>
{
	let log = utils.startLog(request, 'reactrendering');

	if (constants.LIVE_SITE && request.headers['host'] !== 'www.animalcrossingcommunity.com')
	{
		log += ` status=302`;
		console.info(log);

		// 259200 = 3 days
		response.set('Cache-Control', 'public, max-age=0, s-maxage=259200');

		return response.redirect(
			302,
			'https://www.animalcrossingcommunity.com'
		);
	}

	let clientRequest:any = createFetchRequest(request);

	// when rendering server-side, send authenticated user to routing's loader functions
	clientRequest.session = {};
	clientRequest.session.user = request.session.user;

	let context:StaticHandlerContext|Response;

	try
	{
		context = await handler.query(clientRequest);
	}
	// Request timeouts
	catch (queryError)
	{
		log += ` status=500`;
		console.info(log);

		console.error('Logging query error response:');
		console.error(queryError);

		response.set('Cache-Control', 'no-store');

		return response.render('500');
	}

	if (
		context instanceof Response &&
		[301, 302, 303, 307, 308].includes(context.status)
	)
	{
		log += ` status=${context.status}`;
		console.info(log);

		// 259200 = 3 days
		response.set('Cache-Control', 'public, max-age=0, s-maxage=259200');

		return response.redirect(
			context.status,
			context.headers.get('Location')
		);
	}

	const staticHandlerContext = context as StaticHandlerContext;

	// 400s, 500s
	if (staticHandlerContext.errors)
	{
		const error = staticHandlerContext.errors['0'];
		const status = error.status ? error.status : 500;

		log += ` status=${status}`;
		console.info(log);

		response.status(status);

		if (status != 404)
		{
			console.error('Logging error response:');
			console.error(error);

			response.set('Cache-Control', 'no-store');
		}
		else
		{
			// 259200 = 3 days
			response.set('Cache-Control', 'public, max-age=0, s-maxage=259200');
		}

		if (error.data && (error.data.name === 'ProfanityError' || error.data.name === 'UserError'))
		{
			let details:any;

			if (error.data.name === 'UserError')
			{
				details = error.data.identifiers.map(
					(id:any) => { return { id, message: (errors.ERROR_MESSAGES as any)[id].message } }
				);
			}
			else if (error.data.name === 'ProfanityError')
			{
				details = error.data.identifier.map(
					(id:any) => { return { id, message: `${(errors.ERROR_MESSAGES as any)[id].message} ${error.data.words}` } }
				);
			}

			return response.render('error', { errors: details });
		}

		return response.render(status === 404 ? '404' : '500');
	}

	const markup = ReactDOMServer.renderToString(
		<StaticRouterProvider
			router={createStaticRouter(
				handler.dataRoutes,
				staticHandlerContext
			)}
			context={staticHandlerContext}
		/>
	);

	const searchParams = new URLSearchParams(staticHandlerContext.location.search);

	let query:any = {};

	for (const [key, value] of searchParams.entries())
	{
		query[key] = value;
	}

	// update session
	if (request.session.user)
	{
		const params = staticHandlerContext.matches.find(m => m.pathname === staticHandlerContext.location.pathname)?.params;

		(iso as any).query(request.session.user, 'v1/session/update', {
			url: staticHandlerContext.location.pathname,
			params: params,
			query: query
		});

		const sessionId = request.cookies['connect.sid'];

		if (sessionId)
		{
			const [user] = await db.query(`
				SELECT id
				FROM users
				WHERE id = $1 AND stay_forever = true
			`, request.session.user);

			if (user)
			{
				await db.query(`
					UPDATE session
					SET expire = now() + interval '1 year'
					WHERE (sess->'user')::text = $1::text
				`, request.session.user);

				response.cookie('connect.sid', sessionId, { maxAge: 366 * 24 * 60 * 60 * 1000, httpOnly: true });
			}
		}
	}

	// figure out favicon
	let icon = `${constants.AWS_URL}/images/layout/favicon/`;

	if (constants.LIVE_SITE || query.debug)
	{
		const {season} = getSeason(constants.LIVE_SITE ? null: query.debug);

		icon += `gyroid-${season}.ico`;
	}
	else
	{
		icon += 'gyroid-test.ico';
	}

	const title:string = await (iso as any).query(request.session.user, 'v1/title', {
		pathname: staticHandlerContext.location.pathname
	});

	log += ` status=200`;
	console.info(log);

	response.set('Cache-Control', 'no-store');

	return response.render('index', {
		markup,
		icon,
		version: constants.version,
		vendor_version: constants.vendorVersion,
		title
	});
});

// From React-Router 6 docs
function createFetchRequest(req:any) : Request
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
	req.on('close', () => controller.abort());

	let headers:any = new Headers();

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

	let init:any = {
		method: req.method,
		headers,
		signal: controller.signal,
	};

	if (req.method !== "GET" && req.method !== "HEAD")
	{
		init.body = req.body;
	}

	try
	{
		return new Request(url.href, init);
	}
	catch (e)
	{
		console.error('Request throwing error');
		console.error(e);
		req.url = '';
		return createFetchRequest(req);
	}
};

export default app;
