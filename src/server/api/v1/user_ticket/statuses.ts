import * as db from '@db';
import { APIThisType, UserTicketStatusType } from '@types';

async function statuses(this: APIThisType): Promise<UserTicketStatusType[]>
{
	return await db.query(`
		SELECT
			id,
			name
		FROM user_ticket_status
		ORDER BY id ASC
	`);
}

statuses.permissions = [
	'process-user-tickets',
];

export default statuses;
