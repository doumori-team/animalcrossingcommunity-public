import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, MonumentType } from '@types';

async function monument(this: APIThisType, { id }: monumentProps): Promise<MonumentType[]>
{
	const monuments = await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			monument.id,
			monument.name
		FROM monument
		JOIN ac_game_monument ON (monument.id = ac_game_monument.monument_id)
		WHERE ac_game_monument.game_id = $1::int
		ORDER BY monument.id ASC
	`, id);

	return monuments;
}

monument.permissions = [
	'modify-towns',
];

monument.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
};

type monumentProps = {
	id: number
};

export default monument;
