import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';

export default async function grass_shape()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			grass_shape.id,
			grass_shape.name
		FROM grass_shape
		ORDER BY grass_shape.name ASC
	`);
}