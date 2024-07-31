import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import { APIThisType, HemisphereType } from '@types';

export default async function hemisphere(this: APIThisType) : Promise<HemisphereType[]>
{
	const [modifyTownsPerm, modifyProfilePerm] = await Promise.all([
		this.query('v1/permission', {permission: 'modify-towns'}),
		this.query('v1/permission', {permission: 'modify-profile'}),
	]);

	if (!(modifyTownsPerm || modifyProfilePerm))
	{
		throw new UserError('permission');
	}

	return await db.cacheQuery(constants.cacheKeys.acGame, `
		SELECT
			hemisphere.id,
			hemisphere.name
		FROM hemisphere
		ORDER BY hemisphere.name ASC
	`);
}