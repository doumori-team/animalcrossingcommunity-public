import * as db from '@db';
import { APIThisType, UserTicketBanLengthType } from '@types';

export default async function ban_lengths(this: APIThisType): Promise<UserTicketBanLengthType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'process-user-tickets' });

	if (!permissionGranted)
	{
		return [];
	}

	return await db.query(`
		SELECT
			id,
			description
		FROM ban_length
		WHERE active = true
		ORDER BY days ASC
	`);
}
