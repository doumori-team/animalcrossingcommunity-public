import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';

async function claim({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [userTicket] = await db.query(`
		SELECT user_ticket.assignee_id, user_ticket_status.name AS status, user_group.identifier
		FROM user_ticket
		JOIN user_ticket_status ON (user_ticket.status_id = user_ticket_status.id)
		JOIN users ON (users.id = user_ticket.violator_id)
		JOIN user_group ON (user_group.id = users.user_group_id)
		WHERE user_ticket.id = $1::int
	`, id);

	// only can claim it if unassigned to you, Open and an admin if mod violator
	const processModTicket = await this.query('v1/permission', {permission: 'process-mod-tickets'});
	const staffIdentifiers = constants.staffIdentifiers;

	if (userTicket.assignee_id !== null || userTicket.status !== 'Open' || ([
		staffIdentifiers.mod,
		staffIdentifiers.admin,
		staffIdentifiers.owner
	].includes(userTicket.identifier) && !processModTicket))
	{
		throw new UserError('permission');
	}

	await Promise.all([
		db.query(`
			UPDATE user_ticket
			SET assignee_id = $2::int, last_updated = now()
			WHERE id = $1::int AND assignee_id IS NULL
		`, id, this.userId),
		this.query('v1/notification/destroy', {
			id: id,
			type: constants.notification.types.modminUT
		}),
		this.query('v1/notification/destroy', {
			id: id,
			type: constants.notification.types.modminUTMany
		}),
	]);
}

claim.apiTypes = {
	id: {
		type: APITypes.userTicketId,
	},
}

export default claim;