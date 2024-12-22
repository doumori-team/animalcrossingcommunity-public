import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, UserTicketTypeType } from '@types';

export default async function types(this: APIThisType): Promise<UserTicketTypeType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'process-user-tickets' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.query(`
		SELECT
			id,
			description
		FROM user_ticket_type
		ORDER BY description ASC
	`);
}
