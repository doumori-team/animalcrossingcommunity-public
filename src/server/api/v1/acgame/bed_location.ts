import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, BedLocationType } from '@types';

async function bed_location(this: APIThisType, { id }: bedLocationProps): Promise<BedLocationType[]>
{
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

bed_location.permissions = [
	'modify-towns',
];

bed_location.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
};

type bedLocationProps = {
	id: number
};

export default bed_location;
