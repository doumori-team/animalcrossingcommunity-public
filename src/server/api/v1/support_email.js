import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';

async function support_email({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	let [supportEmail] = await db.query(`
		SELECT
			support_email.id,
			support_email.subject,
			support_email.body,
			support_email.to_user_id,
			support_email.to_email,
			support_email.from_user_id,
			support_email.from_email,
			support_email.read,
			support_email.recorded,
			to_account_cache.username AS to_username,
			from_account_cache.username AS from_username
		FROM support_email
		LEFT JOIN user_account_cache AS to_account_cache ON (to_account_cache.id = support_email.to_user_id)
		LEFT JOIN user_account_cache AS from_account_cache ON (from_account_cache.id = support_email.from_user_id)
		WHERE support_email.id = $1::int
	`, id);

	if (!supportEmail)
	{
		throw new UserError('no-such-support-email');
	}

	// workaround because tenmin.cjs doesn't support importing accounts
	if (supportEmail.from_user_id === null && supportEmail.from_email)
	{
		try
		{
			const user = await accounts.getUserData(null, null, supportEmail.from_email);

			supportEmail.from_user_id = user.id;

			await db.query(`
				UPDATE support_email
				SET from_user_id = $2
				WHERE id = $1
			`, supportEmail.id, user.id);
		}
		catch (error)
		{
			// error OR user doesn't exist
		}
	}

	return {
		id: supportEmail.id,
		fromUser: supportEmail.from_user_id || supportEmail.from_email ? {
			id: supportEmail.from_user_id,
			email: supportEmail.from_email,
			username: supportEmail.from_username,
		} : null,
		toUser: supportEmail.to_email ? {
			id: supportEmail.to_user_id,
			email: supportEmail.to_email,
			username: supportEmail.to_username,
		} : null,
		formattedRecorded: dateUtils.formatDateTime(supportEmail.recorded),
		subject: supportEmail.subject,
		body: supportEmail.body,
		read: supportEmail.read,
	};
}

support_email.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default support_email;
