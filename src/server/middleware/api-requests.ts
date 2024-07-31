
import { URL } from 'url';
import express from 'express';
import { generatePath } from 'react-router-dom';

import * as errors from 'common/errors.ts';
import * as iso from 'common/iso.js';
import * as db from '@db';
import * as accounts from '@accounts';
import { utils } from '@utils';

const handler = express();
handler.set('views', new URL('../views', import.meta.url).pathname);

/* Express route for handling requests to the API endpoint.
 *
 * On receiving a request, checks to see if the specified query is a real
 * API method. If so, passes the request body to that query and waits for a
 * return value to return to the client. Otherwise, returns a 404.
 *
 * If the request specified a _callback_uri parameter in the query string, and
 * no errors occurred while executing the query, the response will redirect to
 * the URI provided in that parameter. Before redirecting, if the API method
 * returned a "_success" key, the message in that key will be displayed to the
 * user.
 */
handler.get('/*', handleRequest);
handler.post('/*', handleRequest);

function handleRequest (request:any, response:any, next:any) :any
{
	response.set('Cache-Control', 'no-store');

	let log = utils.startLog(request, 'apirequests');

	const requiresJsonResponse = !(request.body._callback_uri);

	let ipAddresses = request.headers['x-forwarded-for'];

	if (request.headers['cloudfront-viewer-address'])
	{
		ipAddresses = request.headers['cloudfront-viewer-address'].split(':');

		if (ipAddresses.length > 1)
		{
			ipAddresses.pop();
			ipAddresses = ipAddresses.join(':');
		}
	}

	recordIP(request.session.user, ipAddresses);

	const query = request.params[0];
	let params = null;

	if (request.method === 'GET')
	{
		const searchParams = new URLSearchParams(request._parsedUrl.search);
		params = Object.fromEntries(searchParams.entries());
	}
	else
	{
		params = request.body;
	}

	if (query.includes('signup/signup'))
	{
		params.ipAddresses = ipAddresses;
	}

	(iso as any).query(request.session.user, query, params).then((data:any) =>
	{
		if (typeof data === 'object' && data !== null && data.hasOwnProperty('_logout'))
		{
			log += ` status=200`;
			console.info(log);

			// Copied from handle-login-logout
			const userId = request.session.user;
			delete request.session.user;
			let logoutProcess = Promise.all(
			[
				accounts.logout(userId),
				db.logout(userId)
			]);
			logoutProcess.then(() =>
			{
				response.json(data);
			})
			.catch(next);
		}
		else if (requiresJsonResponse)
		{
			log += ` status=200`;
			console.info(log);

			// Unfortunately JSON.stringify and JSON.parse are not perfectly
			// reflexive; JSON.parse(JSON.stringify(undefined)) throws a
			// SyntaxError. This is standardised behaviour, believe it or not.
			// So if an API method returns `undefined`, we replace it with a
			// meaningless value to avoid having the browser choke on it.
			//
			// Reason for the value: The only time this will be seen is if some
			// nosy user is poking around in their browser's developer tools, so
			// it's literally an Easter egg. Just my little joke.
			if (typeof data === 'undefined')
			{
				response.json({'🐰': '🐣'});
			}
			else
			{
				response.json(data);
			}
		}
		else
		{
			log += ` status=303`;
			console.info(log);

			if (typeof data === 'object')
			{
				const callback = generatePath(request.body._callback_uri || data._callback, data);

				if (data._success || data._notice)
				{
					response.render('success', {
						message: data._success || data._notice,
						callback
					});
				}
				else
				{
					response.redirect(303, callback);
				}
			}
			else
			{
				response.redirect(303, request.body._callback_uri);
			}
		}
	}).catch((error:any) =>
	{
		console.error('Error while handling API query:');
		console.error(error);
		console.error('API operation:', query);
		console.error('Request body:', params);

		// see routes.js
		if (error.name === 'NotFoundError')
		{
			log += ` status=404`;
			console.info(log);

			response.status(404);

			if (requiresJsonResponse)
			{
				response.json({});
			}
			else
			{
				response.render('404');
			}
		}
		else if (error.name === 'UserError')
		{
			log += ` status=400`;
			console.info(log);

			// this is an error thrown by us - it's the user's fault
			response.status(400);

			if (requiresJsonResponse)
			{
				response.json({ _errors: error.identifiers });
			}
			else
			{
				const details = error.identifiers.map(
					(id:any) => { return { id, message: (errors.ERROR_MESSAGES as any)[id].message } }
				);

				response.render('error', { errors: details });
			}
		}
		else if (error.name === 'ProfanityError')
		{
			log += ` status=400`;
			console.info(log);

			response.status(400);

			if (requiresJsonResponse)
			{
				response.json({ _errors: [{name:'ProfanityError', message: `${(errors.ERROR_MESSAGES as any)[error.identifier].message} ${error.words}`}] });
			}
			else
			{
				const details = error.identifier.map(
					(id:any) => { return { id, message: `${(errors.ERROR_MESSAGES as any)[id].message} ${error.words}` } }
				);

				response.render('error', { errors: details });
			}
		}
		else
		{
			log += ` status=500`;
			console.info(log);

			// this is an error thrown by the database - it's a bug
			response.status(500);

			if (requiresJsonResponse)
			{
				response.json({});
			}
			else
			{
				response.render('500');
			}
		}
	});
}

// see v1/signup/signup
async function recordIP(user_id:number|null = null, ip_addresses:string|any) : Promise<void>
{
	if (user_id === null || typeof ip_addresses !== 'string')
	{
		return;
	}

	var ipAddresses = ip_addresses.split(',')
		.map(item => item.trim());

	if (ipAddresses.length > 1)
	{
		// firewall IP changes but is always last
		ipAddresses.pop();
	}

	if (ipAddresses.length > 0)
	{
		await Promise.all([
			ipAddresses.map(async (ip) => {
				await db.query(`
					INSERT INTO user_ip_address (user_id, ip_address)
					VALUES ($1::int, $2)
					ON CONFLICT (user_id, ip_address) DO NOTHING
				`, user_id, ip);
			})
		]);
	}
}

export default handler;