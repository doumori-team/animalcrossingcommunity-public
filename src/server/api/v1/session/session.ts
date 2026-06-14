import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants, utils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SessionType, UserLiteType } from '@types';

async function session(this: APIThisType, { id, page, url }: sessionProps): Promise<SessionType>
{
	// Check parameters
	const [userSession] = await db.query(`
		SELECT
			user_session.id,
			user_session.user_id
		FROM user_session
		WHERE user_session.id = $1::int
	`, id);

	if (!userSession)
	{
		throw new UserError('bad-format');
	}

	let urlId: number | null = null;

	if (utils.realStringLength(url) > 0)
	{
		const [checkUrl] = await db.query(`
			SELECT id
			FROM url
			WHERE url = $1
		`, url);

		if (!checkUrl)
		{
			throw new UserError('bad-format');
		}

		urlId = checkUrl.id;
	}

	// Do actual search
	const pageSize = 24;
	const offset = page * pageSize - pageSize;
	let params = [pageSize, offset];
	let paramIndex = params.length;

	let query = `
		SELECT
			user_session_url.date,
			url.url,
			user_session_url.params,
			user_session_url.query,
			count(*) over() AS count
		FROM user_session_url
		JOIN url ON (user_session_url.url_id = url.id)
	`;

	// Add wheres
	let wheres: string[] = [];

	if (urlId !== null && urlId > 0)
	{
		params[paramIndex] = urlId;

		paramIndex++;

		wheres.push(`user_session_url.url_id = $` + paramIndex);
	}

	params[paramIndex] = userSession.id;

	paramIndex++;

	wheres.push(`user_session_url.user_session_id = $` + paramIndex);

	// Combine wheres
	if (wheres.length > 0)
	{
		query += `
			WHERE `;

		for (const key in wheres)
		{
			if (Number(key) > 0)
			{
				query += ` AND `;
			}

			query += wheres[key];
		}
	}

	// Add order by & limit
	query += `
		ORDER BY user_session_url.date ASC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const [urls, user]: [{
		date: Date
		url: string
		params: object
		query: object
		count: number
	}[], UserLiteType] = await Promise.all([
		db.query(query, ...params),
		this.query('v1/user_lite', { id: userSession.user_id }),
	]);

	const result = {
		id: userSession.id,
		user: user,
		urls: [] as {
			formattedDate: string
			url: string
			params: string | null
			query: string | null
		}[],
	};

	if (urls.length > 0)
	{
		result.urls = urls.map(url =>
		{
			return {
				formattedDate: dateUtils.formatDateTime(url.date),
				url: url.url,
				params: url.params ? JSON.stringify(url.params, undefined, 2) : null,
				query: url.query ? JSON.stringify(url.query, undefined, 2) : null,
			};
		});
	}

	return <SessionType>{
		results: result,
		count: urls.length > 0 ? Number(urls[0].count) : 0,
		page: page,
		pageSize: pageSize,
		url: url,
	};
}

session.permissions = [
	'process-user-tickets',
];

session.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	url: {
		type: APITypes.string,
		default: '',
		maxLength: constants.max.url,
	},
};

type sessionProps = {
	id: number
	page: number
	url: string
};

export default session;
