import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function friend_codes({id, page})
{
	const [useTradingPostPerm, useFriendCodes] = await Promise.all([
		this.query('v1/permission', {permission: 'use-trading-post'}),
		this.query('v1/permission', {permission: 'use-friend-codes'}),
	]);

	if (!(useTradingPostPerm || useFriendCodes))
	{
		throw new UserError('permission');
	}

	// Perform queries
	const pageSize = 25;
	const offset = isNaN(page) ? 0 : (page * pageSize) - pageSize;

	let query = `
		SELECT
			friend_code.id,
			count(*) over() AS count
		FROM friend_code
		JOIN game ON game.id = friend_code.game_id
		JOIN game_console ON game_console.id = game.game_console_id
		WHERE friend_code.user_id = $1::int AND game_console.is_enabled AND game.is_enabled
		ORDER BY game_console.is_legacy NULLS FIRST, game_console.sequence, game.sequence, game.name, friend_code.id
	`;

	let params = [id];
	let paramIndex = params.length;

	if (!isNaN(page) && page > 0)
	{
		params[paramIndex] = pageSize;

		paramIndex++;

		params[paramIndex] = offset;

		paramIndex++;

		query += `
			LIMIT $2::int OFFSET $3::int
		`;
	}

	const friendCodes = await db.query(query, ...params);

	const returnedFriendCodes = await Promise.all(friendCodes.map(async(friendCode) => {
		return this.query('v1/friend_code', {id: friendCode.id})
	}));

	return {
		results: returnedFriendCodes.filter(value => Object.keys(value).length !== 0),
		count: friendCodes.length > 0 ? Number(friendCodes[0].count) : 0,
		page: page,
		pageSize: pageSize,
	};
}

friend_codes.apiTypes = {
	id: {
		type: APITypes.userId,
		default: true,
		nullable: true,
	},
	page: {
		type: APITypes.number,
	},
}

export default friend_codes;