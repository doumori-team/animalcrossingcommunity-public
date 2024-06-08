import { NotFoundError } from '@errors';
import * as db from '@db';
import * as APITypes from '@apiTypes';
import { dateUtils, constants } from '@utils';
import { ACCCache } from '@cache';
import * as crypto from 'crypto';

export async function query(userId = null, method, params = {}, tryCache = true)
{
	if (method.includes('v1/status'))
	{
		// update user activity
		await db.query(`
			UPDATE users
			SET last_active_time = now()
			WHERE id = $1::int AND current_ban_length_id IS NULL
		`, userId);

		// update page requests
		await db.query(`
			INSERT INTO site_statistic_data (site_statistic_id, number, date)
			VALUES (1, 1, $1)
			ON CONFLICT (site_statistic_id, date) DO UPDATE SET number = site_statistic_data.number + 1
		`, dateUtils.formatCurrentDateYearMonthDay());
	}
	else if (method.includes('v1/session/update') && params.url === '/donate')
	{
		query(userId, 'v1/notification/destroy', {
			id: userId,
			type: constants.notification.types.donationReminder
		});
	}

	if (tryCache && (('debug' in params && params.debug) || !('debug' in params)) && ![
		'v1/profanity/check',
		'v1/signup/signup',
		'v1/signup/age',
		'v1/signup/consent_denied',
		'v1/signup/consent_given',
		'v1/signup/consent_needed',
		'v1/signup/email_needed',
	].includes(method))
	{
		if (method === 'v1/birthdays')
		{
			// separated by Eastern Time day so we don't wait for 24 hour expiry to hit before getting the day's birthdays
			return await ACCCache.get(`${method}_${dateUtils.getCurrentMonthDay()}`, async () => query(userId, method, params, false));
		}
		else if (userId === null ||
			[
				'v1/user_lite', // cleared when changing username
				'v1/user_groups', // never force cleared
				'v1/donations', // cleared when new donation
				'v1/acgames', // never force cleared
				'v1/acgame', // never force cleared
				'v1/rule/current', // cleared when publishing rules
				'v1/rule/categories', // never force cleared
				'v1/user_group/users' // cleared when changing user's user group
			].includes(method)
			// don't include ones that check perms inside, include login-needed
			// otherwise it might log visitor ones and use for users or vice-versa
		)
		{
			const cacheKey = `${method}_${crypto.createHash('sha1').update(method + JSON.stringify(params)).digest('hex')}`;

			return await ACCCache.get(cacheKey, async () => query(userId, method, params, false));
		}
	}

	try
	{
		const func = (await import(`./api/${method}.js`)).default;

		if (func.apiTypes)
		{
			params = await APITypes.parse
				.bind({
					userId,
					query: query.bind(null, userId)
				})
				(func.apiTypes, params);
		}

		return await func
			.bind({
				userId,
				query: query.bind(null, userId)
			})
			(params);
	}
	catch (error)
	{
		if (error.code === 'MODULE_NOT_FOUND')
		{
			// We got an error because that API method doesn't exist.
			// Wrap it in a custom error to indicate that we know why it
			// happened, then pass it on.
			throw new NotFoundError(method, error);
		}
		else
		{
			// It's some other error - ignore it and pass it on.
			throw error;
		}
	}
}