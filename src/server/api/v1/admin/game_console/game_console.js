import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function game_console({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'games-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [gameConsole] = await db.query(`
		SELECT
			game_console.id,
			game_console.name,
			game_console.sequence,
			game_console.is_legacy,
			game_console.is_enabled
		FROM game_console
		WHERE game_console.id = $1::int
	`, id);

	if (!gameConsole)
	{
		throw new UserError('no-such-game-console');
	}

	return {
		id: gameConsole.id,
		name: gameConsole.name,
		sequence: gameConsole.sequence,
		isLegacy: gameConsole.is_legacy,
		isEnabled: gameConsole.is_enabled
	};
}

game_console.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default game_console;