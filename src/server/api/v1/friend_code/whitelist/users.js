import * as db from '@db';
import { UserError } from '@errors';

export default async function users()
{
	if (!this.userId)
	{
		return [];
	}

	const permissionGranted = await this.query('v1/permission', {permission: 'use-friend-codes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check paramters
	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Perform queries
	const users = await db.query(`
		SELECT friend_code_whitelist.whitelist_user_id
		FROM friend_code_whitelist
		JOIN user_account_cache ON (user_account_cache.id = friend_code_whitelist.whitelist_user_id)
		WHERE friend_code_whitelist.user_id = $1::int
		GROUP BY friend_code_whitelist.whitelist_user_id, user_account_cache.username
		ORDER BY user_account_cache.username ASC
	`, this.userId);

	return await Promise.all(users.map(async(user) => {
		const userObj = await this.query('v1/user_lite', {id: user.whitelist_user_id});

		return {
			id: userObj.id,
			username: userObj.username,
		}
	}));
}