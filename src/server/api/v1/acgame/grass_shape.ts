import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, GrassShapeType } from '@types';

async function grass_shape(this: APIThisType): Promise<GrassShapeType[]>
{
	return await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			grass_shape.id,
			grass_shape.name
		FROM grass_shape
		ORDER BY grass_shape.name ASC
	`);
}

grass_shape.permissions = [
	'modify-towns',
];

export default grass_shape;
