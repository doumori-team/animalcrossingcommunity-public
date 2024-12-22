import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SupportTicketType } from '@types';

async function support_ticket(this: APIThisType, { id }: supportTicketProps): Promise<SupportTicketType>
{
	const [processSupportTickets, submitSupportTickets] = await Promise.all([
		this.query('v1/permission', { permission: 'process-support-tickets' }),
		this.query('v1/permission', { permission: 'submit-support-tickets' }),
	]);

	if (!(processSupportTickets || submitSupportTickets))
	{
		throw new UserError('permission');
	}

	const [supportTicket] = await db.query(`
		SELECT
			support_ticket.id,
			support_ticket.title,
			support_ticket.user_id,
			support_ticket.user_ticket_id,
			support_ticket.ban_length_id,
			support_ticket.staff_only,
			support_ticket.status,
			ban_length.description,
			ban_length.days
		FROM support_ticket
		LEFT JOIN ban_length ON (ban_length.id = support_ticket.ban_length_id)
		WHERE support_ticket.id = $1::int
	`, id);

	if (!supportTicket)
	{
		throw new UserError('no-such-support-ticket');
	}

	const notificationTypes = constants.notification.types;

	const [currentBan, user, messages] = await Promise.all([
		this.query('v1/users/ban_length', { id: supportTicket.user_id }),
		this.query('v1/user_lite', { id: supportTicket.user_id }),
		db.query(`
			SELECT id, user_id, message, created, message_format, staff_only
			FROM support_ticket_message
			WHERE support_ticket_id = $1::int
			ORDER BY created ASC
		`, supportTicket.id),
		this.query('v1/notification/destroy', {
			id: supportTicket.id,
			type: notificationTypes.supportTicket,
		}),
		this.query('v1/notification/destroy', {
			id: supportTicket.id,
			type: notificationTypes.supportTicketProcessed,
		}),
	]);

	if (!processSupportTickets && (supportTicket.user_id !== this.userId || supportTicket.staff_only))
	{
		throw new UserError('permission');
	}

	return <SupportTicketType>{
		id: supportTicket.id,
		staffOnly: supportTicket.staff_only,
		title: supportTicket.title,
		user: user,
		formattedCreated: dateUtils.formatDateTime(messages[0].created),
		userTicketId: processSupportTickets ? supportTicket.user_ticket_id : null,
		ban: supportTicket.ban_length_id ? {
			id: supportTicket.ban_length_id,
			description: supportTicket.description,
			days: supportTicket.days,
		} : null,
		currentBan: currentBan,
		messages: await Promise.all(messages.filter((m: any) => processSupportTickets || !m.staff_only).map(async (message: any) =>
		{
			return {
				id: message.id,
				user: processSupportTickets || message.user_id === this.userId ? await this.query('v1/user_lite', { id: message.user_id }) : null,
				formattedDate: dateUtils.formatDateTime(message.created),
				message: message.message,
				staffOnly: message.staff_only,
				format: message.message_format,
			};
		})),
		status: supportTicket.status,
	};
}

support_ticket.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type supportTicketProps = {
	id: number
};

export default support_ticket;
