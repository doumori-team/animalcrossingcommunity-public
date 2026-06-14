import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, GamesType } from '@types';

async function games(this: APIThisType): Promise<GamesType[]>
{
	const games: {
		id: number
		name: string
		pattern: string
		placeholder: string
		console_name: string
		acgame_id: number | null
	}[] = await db.cacheQuery(constants.cacheKeys.games, `
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
		WHERE game_console.is_enabled AND game.is_enabled
		ORDER BY game_console.is_legacy NULLS FIRST, game_console.sequence, game.sequence, game.name
	`);

	return games.map(game =>
	{
		return {
			id: game.id,
			name: game.name,
			pattern: game.pattern,
			placeholder: game.placeholder,
			consoleName: game.console_name,
			acGameId: game.acgame_id,
		};
	});
}

games.permissions = [
	'use-friend-codes',
	'use-trading-post',
];

export default games;
