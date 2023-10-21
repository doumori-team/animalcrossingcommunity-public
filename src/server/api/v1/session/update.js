import * as db from '@db';
import { dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

async function update({url, params, query})
{
	if (!this.userId)
	{
		return false;
	}

	// Check parameters
	try
	{
		params = JSON.stringify(params);

		const jsonParams = JSON.parse(params);

		if (Object.keys(jsonParams).length === 0)
		{
			params = null;
		}
	}
	catch (e)
	{
		params = null;
	}

	try
	{
		query = JSON.stringify(query);

		const jsonQuery = JSON.parse(query);

		if (Object.keys(jsonQuery).length === 0)
		{
			query = null;
		}
	}
	catch (e)
	{
		query = null;
	}

	// Perform queries

	// create new row if needed for url
	let [urlId] = await db.query(`
		SELECT url.id
		FROM url
		WHERE url.url = $1
	`, url);

	if (!urlId)
	{
		[urlId] = await db.query(`
			INSERT INTO url (url)
			VALUES ($1)
			RETURNING id
		`, url);
	}

	// find last session and update it if necessary
	let userSession;

	[userSession] = await db.query(`
		SELECT
			user_session.id,
			user_session.user_id,
			user_session.end_date
		FROM user_session
		WHERE user_session.user_id = $1
		ORDER BY start_date DESC
	`, this.userId);

	let insert = false, close = false;

	// if doesn't exist or has an end date, create new one
	if (!userSession || userSession.end_date !== null)
	{
		insert = true;
	}
	else if (userSession.end_date === null)
	{
		const [userSessionUrl] = await db.query(`
			SELECT user_session_url.date
			FROM user_session_url
			WHERE user_session_url.user_session_id = $1::int
			ORDER BY user_session_url.date DESC
			LIMIT 1
		`, userSession.id);

		const [user] = await db.query(`
			SELECT last_active_time
			FROM users
			WHERE id = $1::int
		`, userSession.user_id);

		// if we're logging out, close out the session
		if (url === 'logout')
		{
			close = true;
		}
		// if just inserted in a new one (multiple async promises going off) BUT no url
		// OR if activity within 15 minutes of last session, continue it
		else if (!userSessionUrl || dateUtils.isAfterTimezone(userSessionUrl?.date, dateUtils.subtract(dateUtils.dateToTimezone(user.last_active_time), 15, 'minutes')))
		{
			// continue, so do nothing
		}
		// otherwise close out old session and create new one
		else
		{
			close = true;
			insert = true;
		}
	}

	await db.transaction(async dbQuery =>
	{
		if (close)
		{
			await dbQuery(`
				UPDATE user_session
				SET end_date = now()
				WHERE user_session.id = $1::int
			`, userSession.id);
		}

		if (insert)
		{
			[userSession] = await dbQuery(`
				INSERT INTO user_session (user_id)
				VALUES ($1::int)
				RETURNING id
			`, this.userId);
		}

		await dbQuery(`
			INSERT INTO user_session_url (user_session_id, url_id, params, query)
			VALUES ($1::int, $2::int, $3, $4)
		`, userSession.id, urlId.id, params, query);
	});
}

update.apiTypes = {
	url: {
		type: APITypes.string,
		default: '',
		required: true,
	},
	// params & query left alone on purpose
}

export default update;