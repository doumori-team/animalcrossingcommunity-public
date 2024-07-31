import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, GameConsoleType } from '@types';

async function game_console(this: APIThisType, {id}: gameConsoleProps) : Promise<GameConsoleType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'games-admin'});

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

	return <GameConsoleType>{
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

type gameConsoleProps = {
	id: number
}

export default game_console;