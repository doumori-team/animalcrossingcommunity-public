import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function ordinance({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.query(`
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
	},
}

export default ordinance;