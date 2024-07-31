import { URL } from 'url';
import express from 'express';

import * as db from '@db';
import * as accounts from '@accounts';
import { constants, dateUtils, utils } from '@utils';

const handler = express();
handler.set('views', new URL('../views', import.meta.url).pathname);

handler.post('/*', async (request, response) => {

	if (utils.realStringLength(request.body.text) === 0)
	{
		console.error(`Mail Parse Error: Unable to import ${request.body.subject} ${request.body.from}`);
		return response.status(400).send();
	}

	let dateMatches = request.body.headers.match(/Date: .*-0400/gm);
	let recorded = (new Date()).toISOString();

	if (dateMatches)
	{
		recorded = (dateUtils.toDate(dateMatches[0].substring(6))).toISOString();
	}

	let subject = request.body.subject;
	let from = request.body.from;
	let to = process.env.EMAIL_USER;
	let fromUserId = null;
	let body = request.body.text;

	if (from.includes('<') && from.includes('>'))
	{
		let fromMatches = from.match(constants.regexes.parseEmail);

		if (fromMatches)
		{
			from = fromMatches[0];
		}
	}

	try
	{
		const user = await accounts.getUserData(null, null, from);

		fromUserId = user.id;
	}
	catch (error)
	{
		// error OR user doesn't exist
	}

	const [supportEmail] = await db.query(`
		INSERT INTO support_email (from_email, from_user_id, to_email, subject, recorded, body)
		VALUES ($1, $2, $3, $4, $5, $6)
		RETURNING id
	`, from, fromUserId, to, subject, recorded, body);

	await db.query(`
		INSERT INTO notification (user_id, reference_id, reference_type_id, description)
		SELECT users.id, $1, 32, 'New Support Email'
		FROM users
		WHERE users.user_group_id = 2
	`, supportEmail.id);

	console.info(`Email imported: ${subject} ${from}`);

	return response.status(200).send();
});

export default handler;