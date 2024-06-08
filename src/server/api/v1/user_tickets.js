import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';

async function user_tickets({page, statusId, assignee, ruleId, typeId, denyReasonId, violator})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	let checkId;

	if (statusId > 0)
	{
		let [checkId] = await db.query(`
			SELECT id
			FROM user_ticket_status
			WHERE id = $1::int
		`, statusId);

		if (!checkId)
		{
			throw new UserError('bad-format');
		}
	}

	if (ruleId > 0)
	{
		[checkId] = await db.query(`
			SELECT id
			FROM rule
			WHERE id = $1::int
		`, ruleId);

		if (!checkId)
		{
			throw new UserError('no-such-rule');
		}
	}

	if (typeId > 0)
	{
		[checkId] = await db.query(`
			SELECT id
			FROM user_ticket_type
			WHERE id = $1::int
		`, typeId);

		if (!checkId)
		{
			throw new UserError('bad-format');
		}
	}

	if (denyReasonId > 0)
	{
		[checkId] = await db.query(`
			SELECT id
			FROM user_ticket_deny_reason
			WHERE id = $1::int
		`, denyReasonId);

		if (!checkId)
		{
			throw new UserError('bad-format');
		}
	}

	// Do actual search
	const pageSize = 24;
	const offset = (page * pageSize) - pageSize;
	let params = [pageSize, offset];
	let paramIndex = params.length;
	let results = [], count = 0;

	let query = `
		SELECT
			user_ticket.id,
			count(*) over() AS count
		FROM user_ticket
	`;

	// Add joins
	if (utils.realStringLength(assignee) > 0)
	{
		query += `
			JOIN user_account_cache AS assignee_user_account ON (assignee_user_account.id = user_ticket.assignee_id)
		`;
	}

	if (utils.realStringLength(violator) > 0)
	{
		query += `
			JOIN user_account_cache AS violator_user_account ON (violator_user_account.id = user_ticket.violator_id)
		`;
	}

	// Add wheres
	let wheres = [];

	if (statusId > 0)
	{
		params[paramIndex] = statusId;

		paramIndex++;

		wheres.push(`user_ticket.status_id = $` + paramIndex);
	}

	if (utils.realStringLength(assignee) > 0)
	{
		params[paramIndex] = assignee;

		paramIndex++;

		wheres.push(`LOWER(assignee_user_account.username) = LOWER($` + paramIndex + `)`);
	}

	if (ruleId > 0)
	{
		params[paramIndex] = ruleId;

		paramIndex++;

		wheres.push(`user_ticket.rule_id = $` + paramIndex);
	}
	else if (ruleId === -1)
	{
		wheres.push(`user_ticket.rule_id IS NOT NULL`);
	}

	if (typeId > 0)
	{
		params[paramIndex] = typeId;

		paramIndex++;

		wheres.push(`user_ticket.type_id = $` + paramIndex);
	}

	if (utils.realStringLength(violator) > 0)
	{
		params[paramIndex] = violator;

		paramIndex++;

		wheres.push(`LOWER(violator_user_account.username) = LOWER($` + paramIndex + `)`);
	}

	if (denyReasonId > 0)
	{
		params[paramIndex] = denyReasonId;

		paramIndex++;

		wheres.push(`user_ticket.deny_reason_id = $` + paramIndex);
	}
	else if (denyReasonId === -1)
	{
		wheres.push(`user_ticket.deny_reason_id IS NOT NULL`);
	}

	// Combine wheres
	if (wheres.length > 0)
	{
		query += `
			WHERE `;

		for (const key in wheres)
		{
			if (key > 0)
			{
				query += ` AND `;
			}

			query += wheres[key];
		}
	}

	// Add order by & limit
	query += `
		ORDER BY user_ticket.last_updated DESC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const userTickets = await db.query(query, ...params);

	if (userTickets.length > 0)
	{
		results = await Promise.all(userTickets.map(async(userTicket) => {
			return this.query('v1/user_ticket', {id: userTicket.id})
		}));

		count = Number(userTickets[0].count);
	}

	return {
		results: results,
		count: count,
		page: page,
		statusId: statusId,
		assignee: assignee,
		ruleId: ruleId,
		typeId: typeId,
		pageSize: pageSize,
		violator: violator,
		denyReasonId: denyReasonId,
	};
}

user_tickets.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	statusId: {
		type: APITypes.number,
		default: 0,
	},
	assignee: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	ruleId: {
		type: APITypes.number,
		default: 0,
	},
	typeId: {
		type: APITypes.number,
		default: 0,
	},
	violator: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	denyReasonId: {
		type: APITypes.number,
		default: 0,
	},
}

export default user_tickets;