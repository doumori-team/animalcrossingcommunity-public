import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, SupportTicketType } from '@types';

export default async function support_tickets(this: APIThisType): Promise<SupportTicketType[]>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Only get STs that aren't staff only
	const tickets = await db.query(`
		SELECT id
		FROM support_ticket
		WHERE user_id = $1::int AND staff_only = false
	`, this.userId);

	return await Promise.all(tickets.map(async (ticket: any) =>
	{
		return this.query('v1/support_ticket', { id: ticket.id });
	}));
}
