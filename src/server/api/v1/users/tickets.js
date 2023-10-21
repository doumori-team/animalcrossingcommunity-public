import * as db from '@db';
import { UserError } from '@errors';

/*
 * Get User's UTs.
 */
export default async function tickets()
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

	// Only get closed UTs that are violations
	const tickets = await db.query(`
		SELECT id
		FROM user_ticket
		WHERE violator_id = $1::int AND (rule_violation_id IS NOT NULL OR rule_id IS NOT NULL)
		ORDER BY user_ticket.last_updated DESC
	`, this.userId);

	return await Promise.all(tickets.map(async(ticket) => {
		return this.query('v1/users/ticket', {id: ticket.id})
	}));
}