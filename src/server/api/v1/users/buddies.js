import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function buddies({online})
{
	if (!this.userId)
	{
		return {
			buddies: [],
			staff: [],
		};
	}

	const permissionGranted = await this.query('v1/permission', {permission: 'use-buddy-system'});

	if (!permissionGranted)
	{
		return {
			buddies: [],
			staff: [],
		};
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Run queries
	// see nodes/StatusIndicator.js
	const [buddies, [userSettings]] = await Promise.all([
		online ? db.query(`
			SELECT user_buddy.buddy_user_id, user_account_cache.username, users.last_active_time
			FROM user_buddy
			JOIN users ON (user_buddy.buddy_user_id = users.id)
			JOIN user_account_cache ON (users.id = user_account_cache.id)
			WHERE user_buddy.user_id = $1::int AND users.last_active_time > now() - interval '15 minutes'
			ORDER BY users.last_active_time DESC
		`, user.id) : db.query(`
			SELECT user_buddy.buddy_user_id, user_account_cache.username, users.last_active_time
			FROM user_buddy
			JOIN users ON (user_buddy.buddy_user_id = users.id)
			JOIN user_account_cache ON (users.id = user_account_cache.id)
			WHERE user_buddy.user_id = $1::int
			ORDER BY users.last_active_time DESC
		`, user.id),
		db.query(`
			SELECT show_staff
			FROM users
			WHERE id = $1
		`, user.id),
	]);

	let staff = [];

	if (userSettings.show_staff)
	{
		if (online)
		{
			staff = await db.query(`
				SELECT users.id, user_account_cache.username, users.last_active_time
				FROM users
				JOIN user_account_cache ON (users.id = user_account_cache.id)
				WHERE users.user_group_id = ANY($1) AND users.last_active_time > now() - interval '15 minutes' AND users.id != $2 AND users.id != ALL($3)
				ORDER BY users.last_active_time DESC
			`, [constants.userGroupIds.admin, constants.userGroupIds.mod, constants.userGroupIds.researcherTL, constants.userGroupIds.devTL, constants.userGroupIds.researcher, constants.userGroupIds.dev, constants.userGroupIds.scout], this.userId, buddies.length > 0 ? buddies.map(b => b.buddy_user_id) : [0]);
		}
		else
		{
			staff = await db.query(`
				SELECT users.id, user_account_cache.username, users.last_active_time
				FROM users
				JOIN user_account_cache ON (users.id = user_account_cache.id)
				WHERE users.user_group_id = ANY($1) AND users.id != $2
				ORDER BY users.last_active_time DESC
			`, [constants.userGroupIds.admin, constants.userGroupIds.mod, constants.userGroupIds.researcherTL, constants.userGroupIds.devTL, constants.userGroupIds.researcher, constants.userGroupIds.dev, constants.userGroupIds.scout], this.userId);
		}
	}

	return {
		buddies: buddies.length > 0 ? buddies.map(buddyUser => {
			return {
				id: buddyUser.buddy_user_id,
				username: buddyUser.username,
				lastActiveTime: buddyUser.last_active_time,
			}
		}) : [],
		staff: staff.length > 0 ? staff.map(buddyUser => {
			return {
				id: buddyUser.id,
				username: buddyUser.username,
				lastActiveTime: buddyUser.last_active_time,
			}
		}) : [],
	};
}

buddies.apiTypes = {
	online: {
		type: APITypes.boolean,
		default: 'false',
	},
}

export default buddies;