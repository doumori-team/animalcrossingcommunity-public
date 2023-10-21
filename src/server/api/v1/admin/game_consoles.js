import * as db from '@db';
import { UserError } from '@errors';

export default async function game_consoles()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'games-admin'});

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

	return await Promise.all(gameConsoles.map(async(gameConsole) => {
		return this.query('v1/admin/game_console/game_console', {id: gameConsole.id})
	}));
}