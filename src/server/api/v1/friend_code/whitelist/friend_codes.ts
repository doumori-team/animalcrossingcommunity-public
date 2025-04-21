import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, WhitelistFriendCodesType } from '@types';

async function friend_codes(this: APIThisType, { sortBy, page, gameId, groupBy }: friendCodesProps): Promise<WhitelistFriendCodesType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'use-friend-codes' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Perform queries
	const pageSize = 25;
	const offset = page * pageSize - pageSize;

	let query = `
		SELECT
			friend_code.id,
			friend_code_whitelist.date,
			count(*) over() AS count
		FROM friend_code
		JOIN friend_code_whitelist ON (friend_code.user_id = friend_code_whitelist.user_id)
		LEFT JOIN user_account_cache ON (user_account_cache.id = friend_code.user_id)
		WHERE friend_code_whitelist.whitelist_user_id = $3::int AND friend_code_whitelist.user_id IN (
			SELECT whitelist_user_id
			FROM friend_code_whitelist
			WHERE user_id = $3::int
		) AND (($4 > 0 AND friend_code.game_id = $4) OR $4 = 0)
	`;

	if (sortBy === 'username')
	{
		query += `
			ORDER BY user_account_cache.username ASC
		`;
	}
	else if (sortBy === 'date')
	{
		query += `
			ORDER BY friend_code_whitelist.date ASC
		`;
	}

	query += `
		LIMIT $1::int OFFSET $2::int
	`;

	const [friendCodes, games] = await Promise.all([
		groupBy === 'game' && gameId > 0 || groupBy === 'all' ? db.query(query, pageSize, offset, this.userId, gameId) : [],
		db.query(`
			SELECT
				game.id,
				game.name,
				game.pattern,
				game.placeholder,
				game_console.name AS console_name,
				ac_game_game.acgame_id
			FROM game
			JOIN game_console ON game_console.id = game.game_console_id
			LEFT JOIN ac_game_game ON (game.id = ac_game_game.game_id)
			JOIN friend_code ON (friend_code.game_id = game.id)
			WHERE game_console.is_enabled AND game.is_enabled AND friend_code.user_id = $1::int
			ORDER BY game_console.is_legacy NULLS FIRST, game_console.sequence, game.sequence, game.name
		`, this.userId),
	]);

	return <WhitelistFriendCodesType>{
		results: await Promise.all(friendCodes.map(async (friendCode: any) =>
		{
			return this.query('v1/friend_code', { id: friendCode.id });
		})),
		count: friendCodes.length > 0 ? Number(friendCodes[0].count) : 0,
		page: page,
		pageSize: pageSize,
		games: games.map((game: any) =>
		{
			return {
				id: game.id,
				name: game.name,
				pattern: game.pattern,
				placeholder: game.placeholder,
				consoleName: game.console_name,
				acGameId: game.acgame_id,
			};
		}),
	};
}

friend_codes.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	sortBy: {
		type: APITypes.string,
		includes: ['username', 'date'],
		required: true,
	},
	gameId: {
		type: APITypes.gameId,
		nullable: true,
	},
	groupBy: {
		type: APITypes.string,
		includes: ['all', 'game'],
		required: true,
	},
};

type friendCodesProps = {
	page: number
	sortBy: 'username' | 'date'
	gameId: number
	groupBy: 'all' | 'game'
};

export default friend_codes;
