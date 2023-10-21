import * as db from '@db';
import { UserError } from '@errors';

export default async function actions()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

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