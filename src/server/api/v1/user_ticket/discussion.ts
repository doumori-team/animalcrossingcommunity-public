import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function discussion(this: APIThisType, {id}: discussionProps) : Promise<void>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'process-user-tickets'});

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

	const statuses = constants.userTicket.statuses;

	// only can deny it if assigned to you and in right status
	if (userTicket.assignee_id !== this.userId || ![statuses.open, statuses.inProgress, statuses.inUserDiscussion].includes(userTicket.status))
	{
		throw new UserError('permission');
	}

	const [status] = await db.query(`
		SELECT id
		FROM user_ticket_status
		WHERE name = $1
	`, statuses.inDiscussion);

	await Promise.all([
		db.query(`
			UPDATE user_ticket
			SET status_id = $2::int, last_updated = now()
			WHERE id = $1::int
		`, id, status.id),
		this.query('v1/notification/create', {
			id: id,
			type: constants.notification.types.modminUTDiscussion
		}),
	]);
}

discussion.apiTypes = {
	id: {
		type: APITypes.userTicketId,
		required: true,
	},
}

type discussionProps = {
	id: number
}

export default discussion;