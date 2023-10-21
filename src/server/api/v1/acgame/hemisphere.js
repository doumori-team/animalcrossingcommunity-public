import * as db from '@db';
import { UserError } from '@errors';

export default async function hemisphere()
{
	const [modifyTownsPerm, modifyProfilePerm] = await Promise.all([
		this.query('v1/permission', {permission: 'modify-towns'}),
		this.query('v1/permission', {permission: 'modify-profile'}),
	]);

	if (!(modifyTownsPerm || modifyProfilePerm))
	{
		throw new UserError('permission');
	}

	return await db.query(`
		SELECT
			hemisphere.id,
			hemisphere.name
		FROM hemisphere
		ORDER BY hemisphere.name ASC
	`);
}