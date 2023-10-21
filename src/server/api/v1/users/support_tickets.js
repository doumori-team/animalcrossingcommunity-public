import * as db from '@db';
import { UserError } from '@errors';

export default async function support_tickets()
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Only get STs that aren't staff only
	const tickets = await db.query(`
		SELECT id
		FROM support_ticket
		WHERE user_id = $1::int AND staff_only = false
	`, this.userId);

	return await Promise.all(tickets.map(async(ticket) => {
		return this.query('v1/support_ticket', {id: ticket.id})
	}));
}