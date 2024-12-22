import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, MonumentType } from '@types';

async function monument(this: APIThisType, { id }: monumentProps): Promise<MonumentType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-towns' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

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
