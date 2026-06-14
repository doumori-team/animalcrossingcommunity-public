import * as db from '@db';
import { APIThisType, TicketType } from '@types';

/*
 * Get User's UTs.
 */
async function tickets(this: APIThisType): Promise<TicketType[]>
{
	// Only get closed UTs that are violations
	const tickets: { id: number }[] = await db.query(`
		SELECT id
		FROM user_ticket
		WHERE violator_id = $1::int AND (rule_violation_id IS NOT NULL OR rule_id IS NOT NULL)
		ORDER BY user_ticket.last_updated DESC
	`, this.userId);

	return await Promise.all(tickets.map(async ticket =>
	{
		return this.query('v1/users/ticket', { id: ticket.id });
	}));
}

tickets.permissions = [
	'userId',
];

export default tickets;
