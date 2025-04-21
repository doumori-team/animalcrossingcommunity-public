import express from 'express';
import multer from 'multer';

import * as errors from 'common/errors.ts';
import { iso } from 'common/iso.ts';
import { utils } from '@utils';

const upload = multer(); // see iso-client; needed for Form, old use case

const handler = express();

handler.use(express.urlencoded({ extended: true }));

handler.get('/*', handleRequest);
handler.post('/*', upload.any(), handleRequest);

// used when call API endpoint (useEffect)
async function handleRequest(request: any, response: any): Promise<any>
{
	response.set('Cache-Control', 'no-store');

	let log = utils.startLog({ location: 'apirequests', request });

	const query = request.params[0];

	if (![
		'v1/users/upload_image',
		'v1/users',
		'v1/guide/upload_image',
		'v1/notification/latest',
		'v1/friend_code/whitelist/users',
		'v1/user_lite',
		'v1/acgame/catalog',
		'v1/catalog',
		'v1/shop/upload_image',
		'v1/paypal/donate',
		'v1/paypal/consent',
	].includes(query))
	{
		log += ` status=404`;
		console.info(log);

		response.status(404);

		response.json({});
	}
	else
	{
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

		(await iso).query(request.session.user, query, params).then(async (data: any) =>
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
				response.json({ '🐰': '🐣' });
			}
			else
			{
				response.json(data);
			}
		}).catch((error: any) =>
		{
			console.error('Error while handling API query:', error);
			console.error('API operation:', query);
			console.error('Request body:', params);

			if (error.name === 'NotFoundError')
			{
				log += ` status=404`;
				console.info(log);

				response.status(404);

				response.json({});
			}
			else if (error.name === 'UserError')
			{
				log += ` status=400`;
				console.info(log);

				// this is an error thrown by us - it's the user's fault
				response.status(400);

				response.json({ _errors: error.identifiers });
			}
			else if (error.name === 'ProfanityError')
			{
				log += ` status=400`;
				console.info(log);

				response.status(400);

				response.json({ _errors: [{ name:'ProfanityError', message: `${(errors.ERROR_MESSAGES as any)[error.identifier].message} ${error.words}` }] });
			}
			else
			{
				log += ` status=500`;
				console.info(log);

				// this is an error thrown by the database - it's a bug
				response.status(500);

				response.json({});
			}
		});
	}
}

export default handler;
