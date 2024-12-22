import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function message(this: APIThisType, { id, message, staffOnly, format }: messageProps): Promise<void>
{
	const [processUserTickets, reportContent] = await Promise.all([
		this.query('v1/permission', { permission: 'process-user-tickets' }),
		this.query('v1/permission', { permission: 'report-content' }),
	]);

	if (!(processUserTickets || reportContent))
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [userTicket] = await db.query(`
		SELECT user_ticket.violator_id, user_ticket_status.name AS status
		FROM user_ticket
		JOIN user_ticket_status ON (user_ticket.status_id = user_ticket_status.id)
		WHERE user_ticket.id = $1::int
	`, id);

	// UT violator may post message if Closed, or anyone (modmin) with UT power
	if (!processUserTickets && (this.userId !== userTicket.violator_id || !['Closed'].includes(userTicket.status)))
	{
		throw new UserError('permission');
	}

	if (this.userId === userTicket.violator_id && !processUserTickets)
	{
		staffOnly = false;
	}

	if (!staffOnly)
	{
		await this.query('v1/profanity/check', { text: message });
	}

	// Perform queries
	const userTicketMessageId = await db.transaction(async (query: any) =>
	{
		const [userTicketMessage] = await query(`
			INSERT INTO user_ticket_message (user_id, user_ticket_id, message, staff_only, message_format) VALUES
			($1::int, $2::int, $3, $4, $5)
			RETURNING id
		`, this.userId, id, message, staffOnly, format);

		const statuses = constants.userTicket.statuses;

		if (userTicket.status === statuses.closed && this.userId === userTicket.violator_id)
		{
			const [status] = await query(`
				SELECT id
				FROM user_ticket_status
				WHERE name = $1
			`, statuses.inUserDiscussion);

			await query(`
				UPDATE user_ticket
				SET status_id = $2::int, last_updated = now()
				WHERE id = $1::int
			`, id, status.id);
		}
		else if (userTicket.status === statuses.inUserDiscussion && !staffOnly)
		{
			const [status] = await query(`
				SELECT id
				FROM user_ticket_status
				WHERE name = $1
			`, statuses.closed);

			await query(`
				UPDATE user_ticket
				SET status_id = $2::int, last_updated = now()
				WHERE id = $1::int
			`, id, status.id);
		}

		return userTicketMessage.id;
	});

	await this.query('v1/notification/create', {
		id: userTicketMessageId,
		type: constants.notification.types.modminUTPost,
	});
}

message.apiTypes = {
	id: {
		type: APITypes.userTicketId,
		required: true,
	},
	message: {
		type: APITypes.string,
		default: '',
		required: true,
	},
	staffOnly: {
		type: APITypes.boolean,
		default: 'false',
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: constants.formatOptions,
		required: true,
	},
};

type messageProps = {
	id: number
	message: string
	staffOnly: boolean
	format: string
};

export default message;
