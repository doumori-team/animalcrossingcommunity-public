import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';

async function patterns({page, name, creator, published, favorite, games})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-patterns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId && page > 1)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	games = await Promise.all(games.map(async(id) =>
	{
		if (isNaN(id))
		{
			throw new UserError('no-such-ac-game');
		}

		const [checkId] = await db.query(`
			SELECT id
			FROM ac_game
			WHERE id = $1::int
		`, id);

		if (!checkId)
		{
			throw new UserError('no-such-ac-game');
		}

		return Number(id);
	}));

	// Do actual search
	const pageSize = 24;
	const offset = (page * pageSize) - pageSize;
	let params = [pageSize, offset];
	let paramIndex = params.length;
	let results = [], count = 0;

	let query = `
		SELECT
			pattern.id,
			count(*) over() AS count
		FROM pattern
	`;

	// Add joins
	if (utils.realStringLength(creator) > 0)
	{
		query += `
			JOIN user_account_cache ON (user_account_cache.id = pattern.creator_id)
		`;
	}

	if (['yes', 'no'].includes(favorite))
	{
		let leftjoin = '';

		if (favorite === 'no')
		{
			leftjoin = 'LEFT '
		}

		query += `
			${leftjoin}JOIN pattern_favorite ON (pattern_favorite.pattern_id = pattern.id)
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

		wheres.push(`pattern.name ilike $` + paramIndex);
	}

	if (['yes', 'no'].includes(published))
	{
		params[paramIndex] = published === 'yes' ? true : false;

		paramIndex++;

		wheres.push(`pattern.published = $` + paramIndex);
	}

	if (['yes', 'no'].includes(favorite))
	{
		if (favorite === 'yes')
		{
			params[paramIndex] = this.userId;

			paramIndex++;

			wheres.push(`pattern_favorite.user_id = $` + paramIndex);
		}
		else
		{
			wheres.push(`pattern_favorite.user_id IS NULL`);
		}
	}

	if (games.length > 0)
	{
		params[paramIndex] = games;

		paramIndex++;

		wheres.push(`pattern.game_id = ANY($` + paramIndex + `)`);
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
		ORDER BY pattern.creation DESC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const patterns = await db.cacheQuery('v1/patterns', query, ...params);

	if (patterns.length > 0)
	{
		results = await Promise.all(patterns.map(async(pattern) => {
			return this.query('v1/pattern', {id: pattern.id})
		}));

		count = Number(patterns[0].count);
	}

	return {
		results: results,
		count: count,
		page: page,
		name: name,
		creator: creator,
		pageSize: pageSize,
		favorite: favorite,
		published: published,
		games: games,
	};
}

patterns.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	name: {
		type: APITypes.string,
		default: '',
		length: constants.max.patternName,
		profanity: true,
	},
	creator: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
		profanity: true,
	},
	published: {
		type: APITypes.string,
		default: 'yes',
		includes: constants.flatBoolOptions,
		required: true,
	},
	favorite: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
		required: true,
	},
	games: {
		type: APITypes.array,
	},
}

export default patterns;