import * as db from '@db';
import { APIThisType, GameConsoleType } from '@types';

async function game_consoles(this: APIThisType): Promise<GameConsoleType[]>
{
	const gameConsoles: { id: number }[] = await db.query(`
		SELECT
			game_console.id
		FROM game_console
		ORDER BY game_console.sequence ASC
	`);

	return await Promise.all(gameConsoles.map(async gameConsole =>
	{
		return this.query('v1/admin/game_console/game_console', { id: gameConsole.id });
	}));
}

game_consoles.permissions = [
	'games-admin',
];

export default game_consoles;
