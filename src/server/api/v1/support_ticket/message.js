import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';

async function message({id, message, userTicketId, status, staffOnly, format, usernameHistoryId})
{
	const [processSupportTickets, submitSupportTickets] = await Promise.all([
		this.query('v1/permission', {permission: 'process-support-tickets'}),
		this.query('v1/permission', {permission: 'submit-support-tickets'}),
	]);

	if (!(processSupportTickets || submitSupportTickets))
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [supportTicket] = await db.query(`
		SELECT support_ticket.user_id
		FROM support_ticket
		WHERE support_ticket.id = $1::int
	`, id);

	if (!supportTicket)
	{
		throw new UserError('no-such-support-ticket');
	}

	// Only user / modmins can post
	if (!processSupportTickets && this.userId !== supportTicket.user_id)
	{
		throw new UserError('permission');
	}

	if (utils.realStringLength(message) === 0)
	{
		return false;
	}

	if (!processSupportTickets)
	{
		userTicketId = 0;
		staffOnly = false;
		usernameHistoryId = null;
	}

	const supportTicketMessageId = await db.transaction(async query =>
	{
		const [[supportTicketMessage]] = await Promise.all([
			query(`
				INSERT INTO support_ticket_message (user_id, support_ticket_id, message, staff_only, message_format) VALUES
				($1::int, $2::int, $3, $4, $5)
				RETURNING id
			`, this.userId, id, message, staffOnly, format),
			userTicketId > 0 ? query(`
				UPDATE support_ticket
				SET user_ticket_id = $2::int
				WHERE id = $1::int
			`, id, userTicketId) : null,
			utils.realStringLength(status) > 0 ? query(`
				UPDATE support_ticket
				SET status = $2
				WHERE id = $1::int
			`, id, status) : null,
		]);

		return supportTicketMessage.id;
	});

	if (usernameHistoryId)
	{
		await accounts.deleteUsernameHistory(usernameHistoryId);
	}

	if (!staffOnly)
	{
		await this.query('v1/notification/create', {
			id: supportTicketMessageId,
			type: constants.notification.types.supportTicket
		});
	}
}

message.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	message: {
		type: APITypes.string,
		default: '',
		length: constants.max.post,
		profanity: true,
	},
	userTicketId: {
		type: APITypes.userTicketId,
		nullable: true,
	},
	status: {
		type: APITypes.string,
		default: constants.supportTicket.status.open,
		includes: constants.supportTicket.statuses,
	},
	staffOnly: {
		type: APITypes.boolean,
		default: 'false',
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
	usernameHistoryId: {
		type: APITypes.number,
		nullable: true,
	},
}

export default message;