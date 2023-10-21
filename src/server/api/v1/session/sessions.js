import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';

async function sessions({page, username, startDate, endDate, urlId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (urlId > 0)
	{
		const [url] = await db.query(`
			SELECT id
			FROM url
			WHERE id = $1::int
		`, urlId);

		if (!url)
		{
			throw new UserError('bad-format');
		}
	}

	// Do actual search
	const pageSize = 24;
	let results = [], count = 0;

	if (
		utils.realStringLength(username) > 0
	)
	{
		const offset = (page * pageSize) - pageSize;
		let params = [pageSize, offset];
		let paramIndex = params.length;

		let query = `
			SELECT
				user_session.id,
				user_session.start_date,
				user_session.end_date,
				count(*) over() AS count
			FROM user_session
		`;

		// Add joins
		if (utils.realStringLength(username) > 0)
		{
			query += `
				JOIN user_account_cache ON (user_account_cache.id = user_session.user_id)
			`;
		}

		// Add wheres
		let wheres = [];

		if (utils.realStringLength(username) > 0)
		{
			params[paramIndex] = username;

			paramIndex++;

			wheres.push(`LOWER(user_account_cache.username) = LOWER($` + paramIndex + `)`);
		}

		if (utils.realStringLength(startDate) > 0)
		{
			params[paramIndex] = startDate;

			paramIndex++;

			wheres.push(`user_session.start_date >= $` + paramIndex);
		}

		if (utils.realStringLength(endDate) > 0)
		{
			params[paramIndex] = endDate;

			paramIndex++;

			wheres.push(`user_session.end_date <= $` + paramIndex);
		}

		if (urlId > 0)
		{
			const sessionIds = (await db.query(`
				SELECT
					user_session_url.user_session_id
				FROM user_session_url
				WHERE user_session_url.url_id = $1::int
			`, urlId)).map(usu => usu.user_session_id);

			params[paramIndex] = sessionIds;

			paramIndex++;

			wheres.push(`user_session.id = ANY($` + paramIndex + `)`);
		}

		// Combine wheres
		if (wheres.length > 0)
		{
			query += `
				WHERE `;

			for (const key in wheres)
			{
				if (key > 0)
				{
					query += ` AND `;
				}

				query += wheres[key];
			}
		}

		// Add order by & limit
		query += `
			ORDER BY user_session.start_date DESC
			LIMIT $1::int OFFSET $2::int
		`;

		// Run query
		const userSessions = await db.query(query, ...params);

		if (userSessions.length > 0)
		{
			results = userSessions.map(userSession => {
				return {
					id: userSession.id,
					formattedStartDate: dateUtils.formatDateTime(userSession.start_date),
					formattedEndDate: userSession.end_date ? dateUtils.formatDateTime(userSession.end_date) : null,
				}
			});

			count = Number(userSessions[0].count);
		}
	}

	return {
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		username: username,
		startDate: startDate,
		endDate: endDate,
		urlId: urlId,
	};
}

sessions.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	username: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	startDate: {
		type: APITypes.date,
		default: '',
	},
	endDate: {
		type: APITypes.date,
		default: '',
	},
	urlId: {
		type: APITypes.number,
		default: 0,
	},
}

export default sessions;