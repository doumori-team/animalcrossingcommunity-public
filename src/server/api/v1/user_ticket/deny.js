import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function deny({id, denyReasonId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [userTicket] = await db.query(`
		SELECT user_ticket.assignee_id, user_ticket_status.name AS status
		FROM user_ticket
		JOIN user_ticket_status ON (user_ticket.status_id = user_ticket_status.id)
		WHERE user_ticket.id = $1::int
	`, id);

	const [reason] = await db.query(`
		SELECT id
		FROM user_ticket_deny_reason
		WHERE id = $1::int
	`, denyReasonId);

	if (!reason)
	{
		throw new UserError('bad-format');
	}

	// only can deny it if assigned to you and in right status
	if (userTicket.assignee_id !== this.userId || !['Open', 'In Progress', 'In Discussion'].includes(userTicket.status))
	{
		throw new UserError('permission');
	}

	const statuses = constants.userTicket.statuses;

	const [status] = await db.query(`
		SELECT id
		FROM user_ticket_status
		WHERE name = $1
	`, statuses.closed);

	await db.query(`
		UPDATE user_ticket
		SET status_id = $2::int, deny_reason_id = $3::int, last_updated = now(), closed = now()
		WHERE id = $1::int
	`, id, status.id, denyReasonId);
}

deny.apiTypes = {
	id: {
		type: APITypes.userTicketId,
	},
	denyReasonId: {
		type: APITypes.number,
		default: 0,
	},
}

export default deny;