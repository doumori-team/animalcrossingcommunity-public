import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, DenyReasonType } from '@types';

export default async function actions(this: APIThisType) : Promise<DenyReasonType[]>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.query(`
		SELECT
			id,
			name,
			active
		FROM user_ticket_deny_reason
		ORDER BY id ASC
	`);
}