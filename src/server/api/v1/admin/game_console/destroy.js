import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';

async function destroy({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'games-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	await db.query(`
		DELETE FROM game_console
		WHERE id = $1::int
	`, id);

	ACCCache.deleteMatch(constants.cacheKeys.games);
}

destroy.apiTypes = {
	id: {
		type: APITypes.gameConsoleId,
	},
}

export default destroy;