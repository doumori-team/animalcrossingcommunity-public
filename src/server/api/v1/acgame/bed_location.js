import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';

async function bed_location({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			bed_location.id,
			bed_location.filename
		FROM bed_location
		JOIN ac_game_bed_location ON (bed_location.id = ac_game_bed_location.bed_location_id)
		WHERE ac_game_bed_location.game_id = $1::int
		ORDER BY bed_location.id ASC
	`, id);
}

bed_location.apiTypes = {
	id: {
		type: APITypes.acgameId,
	},
}

export default bed_location;