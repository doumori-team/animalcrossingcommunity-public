import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function save({whitelistUserId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-friend-codes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const loggedInUser = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(loggedInUser) === 'undefined' || loggedInUser.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Check if user already has whitelisted user
	let [whitelist] = await db.query(`
		SELECT id
		FROM wifi_rating_whitelist
		WHERE user_id = $1::int AND whitelist_user_id = $2::int
	`, this.userId, whitelistUserId);

	// Perform queries
	if (whitelist)
	{
		return;
	}

	await db.query(`
		INSERT INTO wifi_rating_whitelist (user_id, whitelist_user_id)
		VALUES ($1::int, $2::int)
	`, this.userId, whitelistUserId);
}

save.apiTypes = {
	whitelistUserId: {
		type: APITypes.userId,
	},
}

export default save;