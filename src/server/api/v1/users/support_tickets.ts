import * as db from '@db';
import { APIThisType, SupportTicketType } from '@types';

async function support_tickets(this: APIThisType): Promise<SupportTicketType[]>
{
	// Only get STs that aren't staff only
	const tickets: { id: number }[] = await db.query(`
		SELECT id
		FROM support_ticket
		WHERE user_id = $1::int AND staff_only = false
	`, this.userId);

	return await Promise.all(tickets.map(async ticket =>
	{
		return this.query('v1/support_ticket', { id: ticket.id });
	}));
}

support_tickets.permissions = [
	'userId',
];

export default support_tickets;
