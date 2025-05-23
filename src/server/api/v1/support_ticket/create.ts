import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, BanLengthType, MarkupStyleType } from '@types';

async function create(this: APIThisType, { title, message, username, staffOnly, banLengthId, userTicketId, format }: createProps): Promise<{ id: number }>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'submit-support-tickets' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	let userId = this.userId;

	const processSupportTickets: boolean = await this.query('v1/permission', { permission: 'process-support-tickets' });

	if (processSupportTickets)
	{
		userTicketId = userTicketId != null && userTicketId > 0 ? userTicketId : null;

		const [checkUser] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, username);

		if (!checkUser)
		{
			throw new UserError('no-such-user');
		}

		userId = checkUser.id;

		if (banLengthId != null && banLengthId > 0)
		{
			const [ban] = await db.query(`
				SELECT days
				FROM ban_length
				WHERE id = $1::int
			`, banLengthId);

			if (!ban)
			{
				throw new UserError('bad-format');
			}

			// only record ban length if it changed
			const currentBan: BanLengthType | null = await this.query('v1/users/ban_length', { id: userId });

			if (currentBan)
			{
				if (currentBan.id === banLengthId)
				{
					banLengthId = null;
				}
				// can't make a ban longer
				else if (currentBan.days < ban.days)
				{
					throw new UserError('longer-ban');
				}
			}
		}
		else
		{
			banLengthId = null;
		}
	}
	else
	{
		staffOnly = false;
		banLengthId = null;
		userTicketId = null;
	}

	// Perform queries
	const supportTicketId = await db.transaction(async (query: any) =>
	{
		const [supportTicket] = await query(`
			INSERT INTO support_ticket (title, user_id, user_ticket_id, ban_length_id, staff_only) VALUES
			($1, $2::int, $3, $4, $5)
			RETURNING id
		`, title, userId, userTicketId, banLengthId, staffOnly);

		await query(`
			INSERT INTO support_ticket_message (user_id, support_ticket_id, message, message_format) VALUES
			($1::int, $2::int, $3, $4)
		`, this.userId, supportTicket.id, message, format);

		await query(`
			UPDATE users
			SET current_ban_length_id = $1::int
			WHERE id = $2::int
		`, banLengthId, userId);

		return supportTicket.id;
	});

	if (!staffOnly)
	{
		await this.query('v1/notification/create', {
			id: supportTicketId,
			type: constants.notification.types.supportTicketProcessed,
		});
	}

	return {
		id: supportTicketId,
	};
}

create.apiTypes = {
	title: {
		type: APITypes.string,
		default: '',
		length: constants.max.postTitle,
		profanity: true,
	},
	message: {
		type: APITypes.string,
		default: '',
		length: constants.max.post1,
		profanity: true,
	},
	username: {
		type: APITypes.string,
		default: '',
	},
	staffOnly: {
		type: APITypes.boolean,
		default: 'false',
	},
	banLengthId: {
		type: APITypes.number,
		default: 0,
	},
	userTicketId: {
		type: APITypes.userTicketId,
		nullable: true,
	},
	format: {
		type: APITypes.string,
		default: '',
		includes: ['markdown', 'bbcode', 'plaintext'],
		required: true,
	},
};

type createProps = {
	title: string
	message: string
	username: string
	staffOnly: boolean
	banLengthId: number | null
	userTicketId: number | null
	format: MarkupStyleType
};

export default create;
