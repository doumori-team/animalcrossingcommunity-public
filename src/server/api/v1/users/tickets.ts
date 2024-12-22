import * as db from '@db';
import { UserError } from '@errors';
import { APIThisType, TicketType } from '@types';

/*
 * Get User's UTs.
 */
export default async function tickets(this: APIThisType): Promise<TicketType[]>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', { id: this.userId });

	// Only get closed UTs that are violations
	const tickets = await db.query(`
		SELECT id
		FROM user_ticket
		WHERE violator_id = $1::int AND (rule_violation_id IS NOT NULL OR rule_id IS NOT NULL)
		ORDER BY user_ticket.last_updated DESC
	`, this.userId);

	return await Promise.all(tickets.map(async (ticket: any) =>
	{
		return this.query('v1/users/ticket', { id: ticket.id });
	}));
}
