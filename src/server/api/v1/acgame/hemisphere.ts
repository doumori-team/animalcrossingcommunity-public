import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, HemisphereType } from '@types';

async function hemisphere(this: APIThisType): Promise<HemisphereType[]>
{
	return await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			hemisphere.id,
			hemisphere.name
		FROM hemisphere
		ORDER BY hemisphere.name ASC
	`);
}

hemisphere.permissions = [
	'modify-towns',
	'modify-profile',
];

export default hemisphere;
