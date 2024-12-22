import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, OrdinanceType } from '@types';

async function ordinance(this: APIThisType, { id }: ordinanceProps): Promise<OrdinanceType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-towns' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			ordinance.id,
			ordinance.name
		FROM ordinance
		JOIN ac_game_ordinance ON (ordinance.id = ac_game_ordinance.ordinance_id AND ac_game_ordinance.game_id = $1::int)
	`, id);
}

ordinance.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
};

type ordinanceProps = {
	id: number
};

export default ordinance;
