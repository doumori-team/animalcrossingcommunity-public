import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function game({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'games-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [game] = await db.query(`
		SELECT
			game.id,
			game.game_console_id,
			game.name,
			game.short_name,
			game.pattern,
			game.placeholder,
			game.sequence,
			game.is_enabled
		FROM game
		WHERE game.id = $1::int
	`, id);

	if (!game)
	{
		throw new UserError('no-such-game');
	}

	return {
		id: game.id,
		gameConsoleId: game.game_console_id,
		name: game.name,
		shortName: game.short_name,
		pattern: game.pattern,
		placeholder: game.placeholder,
		sequence: game.sequence,
		isEnabled: game.is_enabled
	};
}

game.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default game;