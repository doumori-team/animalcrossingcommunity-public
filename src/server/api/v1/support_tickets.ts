import * as db from '@db';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SupportTicketsType } from '@types';

async function support_tickets(this: APIThisType, { page, searchUser, userTicketId, status }: supportTicketsProps): Promise<SupportTicketsType>
{
	// Do actual search
	const pageSize = 24;
	let results: SupportTicketsType['results'] = [], count = 0;

	if (
		utils.realStringLength(searchUser) > 0 ||
		userTicketId > 0 ||
		utils.realStringLength(status) > 0
	)
	{
		const offset = page * pageSize - pageSize;
		let params: (number | string)[] = [pageSize, offset];
		let paramIndex = params.length;

		let query = `
			SELECT
				support_ticket.id,
				count(*) over() AS count
			FROM support_ticket
		`;

		// Add joins
		if (utils.realStringLength(searchUser) > 0)
		{
			query += `
				JOIN user_account_cache ON (user_account_cache.id = support_ticket.user_id)
			`;
		}

		if (userTicketId > 0)
		{
			query += `
				JOIN user_ticket ON (user_ticket.id = support_ticket.user_ticket_id)
			`;
		}

		// Add wheres
		let wheres: string[] = [];

		if (utils.realStringLength(searchUser) > 0)
		{
			params[paramIndex] = searchUser;

			paramIndex++;

			wheres.push(`LOWER(user_account_cache.username) = LOWER($` + paramIndex + `)`);
		}

		if (userTicketId > 0)
		{
			params[paramIndex] = userTicketId;

			paramIndex++;

			wheres.push(`user_ticket.id = $` + paramIndex);
		}

		if (utils.realStringLength(status) > 0)
		{
			params[paramIndex] = status;

			paramIndex++;

			wheres.push(`support_ticket.status = $` + paramIndex);
		}

		// Combine wheres
		if (wheres.length > 0)
		{
			query += `
				WHERE `;

			for (const key in wheres)
			{
				if (Number(key) > 0)
				{
					query += ` AND `;
				}

				query += wheres[key];
			}
		}

		// Add order by & limit
		query += `
			ORDER BY support_ticket.id DESC
			LIMIT $1::int OFFSET $2::int
		`;

		// Run query
		const supportTickets: { id: number, count: number }[] = await db.query(query, ...params);

		if (supportTickets.length > 0)
		{
			results = await Promise.all(supportTickets.map(async supportTicket =>
			{
				return this.query('v1/support_ticket', { id: supportTicket.id });
			}));

			count = Number(supportTickets[0].count);
		}
	}

	return <SupportTicketsType>{
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		searchUser: searchUser,
		userTicketId: userTicketId,
		status: status,
	};
}

support_tickets.permissions = [
	'process-support-tickets',
];

support_tickets.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	searchUser: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	userTicketId: {
		type: APITypes.userTicketId,
		nullable: true,
	},
	status: {
		type: APITypes.string,
		includes: constants.supportTicket.statuses,
	},
};

type supportTicketsProps = {
	page: number
	searchUser: string
	userTicketId: number
	status: string
};

export default support_tickets;
