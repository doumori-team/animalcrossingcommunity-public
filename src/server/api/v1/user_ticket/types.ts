import * as db from '@db';
import { APIThisType, UserTicketTypeType } from '@types';

async function types(this: APIThisType): Promise<UserTicketTypeType[]>
{
	return await db.query(`
		SELECT
			id,
			description
		FROM user_ticket_type
		ORDER BY description ASC
	`);
}

types.permissions = [
	'process-user-tickets',
];

export default types;
