import * as db from '@db';
import { UserError } from '@errors';

export default async function buddies()
{
	if (!this.userId)
	{
		return [];
	}

	const permissionGranted = await this.query('v1/permission', {permission: 'use-buddy-system'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Run queries
	const buddies = await db.query(`
		SELECT user_buddy.buddy_user_id, user_account_cache.username, users.last_active_time
		FROM user_buddy
		JOIN users ON (user_buddy.buddy_user_id = users.id)
		JOIN user_account_cache ON (users.id = user_account_cache.id)
		WHERE user_buddy.user_id = $1::int
		ORDER BY users.last_active_time DESC
	`, user.id);

	return buddies.map(buddyUser => {
		return {
			id: buddyUser.buddy_user_id,
			username: buddyUser.username,
			lastActiveTime: buddyUser.last_active_time,
		}
	})
}