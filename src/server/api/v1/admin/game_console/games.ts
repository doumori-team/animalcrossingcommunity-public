import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType, GameType } from '@types';

async function games(this: APIThisType, { id }: gamesProps): Promise<GameType[]>
{
	const games: { id: number }[] = await db.query(`
		SELECT
			game.id
		FROM game
		JOIN game_console ON game_console.id = game.game_console_id
		WHERE game_console.id = $1::int
		ORDER BY game.sequence NULLS LAST, game.name
	`, id);

	return await Promise.all(games.map(async game =>
	{
		return this.query('v1/admin/game/game', { id: game.id });
	}));
}

games.permissions = [
	'games-admin',
];

games.apiTypes = {
	id: {
		type: APITypes.gameConsoleId,
		required: true,
	},
};

type gamesProps = {
	id: number
};

export default games;
