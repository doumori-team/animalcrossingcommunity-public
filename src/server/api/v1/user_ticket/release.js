import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';

async function release({id})
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

	// only can release it if assigned to you and Open
	if (userTicket.assignee_id !== this.userId || userTicket.status !== 'Open')
	{
		throw new UserError('permission');
	}

	await db.query(`
		UPDATE user_ticket
		SET assignee_id = null, last_updated = now()
		WHERE id = $1::int
	`, id);

	await Promise.all([
		this.query('v1/notification/create', {
			id: id,
			type: constants.notification.types.modminUT
		}),
		this.query('v1/notification/create', {
			id: id,
			type: constants.notification.types.modminUTMany
		}),
	]);
}

release.apiTypes = {
	id: {
		type: APITypes.userTicketId,
	},
}

export default release;