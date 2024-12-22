import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { APIThisType, GameType } from '@types';

async function games(this: APIThisType, { id }: gamesProps): Promise<GameType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'games-admin' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const games = await db.query(`
		SELECT
			game.id
		FROM game
		JOIN game_console ON game_console.id = game.game_console_id
		WHERE game_console.id = $1::int
		ORDER BY game.sequence NULLS LAST, game.name
	`, id);

	return await Promise.all(games.map(async (game: any) =>
	{
		return this.query('v1/admin/game/game', { id: game.id });
	}));
}

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
