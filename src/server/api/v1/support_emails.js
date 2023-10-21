import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';

async function support_emails({page, fromUser, fromEmail, toUser, toEmail, startDate, endDate, read, forUser})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	if (utils.realStringLength(toUser) > 0)
	{
		const [checkToUser] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, toUser);

		if (!checkToUser)
		{
			throw new UserError('no-such-user');
		}
	}

	if (utils.realStringLength(fromUser) > 0)
	{
		const [checkFromUser] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, fromUser);

		if (!checkFromUser)
		{
			throw new UserError('no-such-user');
		}
	}

	if (utils.realStringLength(forUser) > 0)
	{
		const [checkForUser] = await db.query(`
			SELECT id
			FROM user_account_cache
			WHERE LOWER(username) = LOWER($1)
		`, forUser);

		if (!checkForUser)
		{
			throw new UserError('no-such-user');
		}
	}

	// Do actual search
	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;
	let params = [pageSize, offset];
	let paramIndex = params.length;
	let results = [], count = 0;

	let query = `
		SELECT
			support_email.id,
			count(*) over() AS count
		FROM support_email
	`;

	// Add joins
	if (utils.realStringLength(toUser) > 0)
	{
		query += `
			JOIN user_account_cache AS to_user_account ON (to_user_account.id = support_email.to_user_id)
		`;
	}

	if (utils.realStringLength(fromUser) > 0)
	{
		query += `
			JOIN user_account_cache AS from_user_account ON (from_user_account.id = support_email.from_user_id)
		`;
	}

	if (utils.realStringLength(forUser) > 0)
	{
		// if we're searching for an email from,
		// we aren't looking for emails sent to another user
		// modmins who send emails out have their id in the from_user_id
		params[paramIndex] = process.env.EMAIL_USER;

		paramIndex++;

		query += `
			JOIN user_account_cache AS for_user_account ON ((for_user_account.id = support_email.from_user_id AND support_email.to_user_email = $${paramIndex}) OR for_user_account.id = support_email.to_user_id)
		`;
	}

	// Add wheres
	let wheres = [];

	if (utils.realStringLength(fromUser) > 0)
	{
		params[paramIndex] = fromUser;

		paramIndex++;

		wheres.push(`LOWER(from_user_account.username) = LOWER($` + paramIndex + `)`);

		// if we're searching for an email from,
		// we aren't looking for emails sent to another user
		// modmins who send emails out have their id in the from_user_id
		params[paramIndex] = process.env.EMAIL_USER;

		paramIndex++;

		wheres.push(`support_email.to_user_email = $` + paramIndex);
	}

	if (utils.realStringLength(fromEmail) > 0)
	{
		params[paramIndex] = '%' + fromEmail + '%';

		paramIndex++;

		wheres.push(`support_email.from_email ilike $` + paramIndex);
	}

	if (utils.realStringLength(toUser) > 0)
	{
		params[paramIndex] = toUser;

		paramIndex++;

		wheres.push(`LOWER(to_user_account.username) = LOWER($` + paramIndex + `)`);
	}

	if (utils.realStringLength(toEmail) > 0)
	{
		params[paramIndex] = '%' + toEmail + '%';

		paramIndex++;

		wheres.push(`support_email.to_email ilike $` + paramIndex);
	}

	if (utils.realStringLength(startDate) > 0)
	{
		params[paramIndex] = startDate;

		paramIndex++;

		wheres.push(`support_email.recorded >= $` + paramIndex);
	}

	if (utils.realStringLength(endDate) > 0)
	{
		params[paramIndex] = endDate;

		paramIndex++;

		wheres.push(`support_email.recorded <= $` + paramIndex);
	}

	if (['yes', 'no'].includes(read))
	{
		params[paramIndex] = read === 'yes' ? true : false;

		paramIndex++;

		wheres.push(`support_email.read = $` + paramIndex);
	}

	if (utils.realStringLength(forUser) > 0)
	{
		params[paramIndex] = forUser;

		paramIndex++;

		wheres.push(`LOWER(for_user_account.username) = LOWER($` + paramIndex + `)`);
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
		ORDER BY support_email.recorded DESC
		LIMIT $1::int OFFSET $2::int
	`;

	// Run query
	const supportEmails = await db.query(query, ...params);

	if (supportEmails.length > 0)
	{
		results = await Promise.all(supportEmails.map(async(supportEmail) => {
			return this.query('v1/support_email', {id: supportEmail.id})
		}));

		count = Number(supportEmails[0].count);
	}

	return {
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		fromUser,
		fromEmail,
		toUser,
		toEmail,
		startDate,
		endDate,
		read,
		forUser
	};
}

support_emails.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	fromUser: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	fromEmail: {
		type: APITypes.regex,
		regex: constants.regexes.email,
		error: 'invalid-email',
	},
	toUser: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	toEmail: {
		type: APITypes.regex,
		regex: constants.regexes.email,
		error: 'invalid-email',
	},
	startDate: {
		type: APITypes.date,
		default: '',
	},
	endDate: {
		type: APITypes.date,
		default: '',
	},
	read: {
		type: APITypes.string,
		default: 'both',
		includes: constants.flatBoolOptions,
	},
	forUser: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
}

export default support_emails;