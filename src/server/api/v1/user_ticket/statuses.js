import * as db from '@db';
import { UserError } from '@errors';

export default async function statuses()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.query(`
		SELECT
			id,
			name
		FROM user_ticket_status
		ORDER BY id ASC
	`);
}