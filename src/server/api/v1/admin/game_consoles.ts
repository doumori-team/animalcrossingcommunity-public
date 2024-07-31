import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, GameConsoleType } from '@types';

export default async function game_consoles(this: APIThisType) : Promise<GameConsoleType[]>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'games-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const gameConsoles = await db.query(`
		SELECT
			game_console.id
		FROM game_console
		ORDER BY game_console.sequence ASC
	`);

	return await Promise.all(gameConsoles.map(async (gameConsole:any) => {
		return this.query('v1/admin/game_console/game_console', {id: gameConsole.id})
	}));
}