import * as db from '@db';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	await db.query(`
		DELETE FROM game_console
		WHERE id = $1::int
	`, id);

	ACCCache.deleteMatch(constants.cacheKeys.games);
}

destroy.permissions = [
	'games-admin',
];

destroy.apiTypes = {
	id: {
		type: APITypes.gameConsoleId,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
