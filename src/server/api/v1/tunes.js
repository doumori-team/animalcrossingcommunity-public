import * as db from '@db';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function tunes({page, name, creator})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-tunes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const pageSize = 24;
	const offset = (page * pageSize) - pageSize;
	let params = [pageSize, offset];
	let paramIndex = params.length;
	let results = [], count = 0;

	let query = `
		SELECT
			town_tune.id,
			count(*) over() AS count
		FROM town_tune
	`;

	// Add joins
	if (utils.realStringLength(creator) > 0)
	{
		query += `
			JOIN user_account_cache ON (user_account_cache.id = town_tune.creator_id)
		`;
	}

	// Add wheres
	let wheres = [];

	if (utils.realStringLength(creator) > 0)
	{
		params[paramIndex] = creator;

		paramIndex++;

		wheres.push(`LOWER(user_account_cache.username) = LOWER($` + paramIndex + `)`);
	}

	if (utils.realStringLength(name) > 0)
	{
		params[paramIndex] = '%' + name + '%';

		paramIndex++;

		wheres.push(`town_tune.name ilike $` + paramIndex);
	}

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
		ORDER BY town_tune.id DESC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const tunes = await db.query(query, ...params);

	if (tunes.length > 0)
	{
		results = await Promise.all(tunes.map(async(tune) => {
			return this.query('v1/tune', {id: tune.id})
		}));

		count = Number(tunes[0].count);
	}

	return {
		results: results,
		count: count,
		page: page,
		name: name,
		creator: creator,
		pageSize: pageSize,
	};
}

tunes.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	name: {
		type: APITypes.string,
		default: '',
		length: constants.max.tuneName,
	},
	creator: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
}

export default tunes;