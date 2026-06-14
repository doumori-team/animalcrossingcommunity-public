import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, BuddiesType } from '@types';

async function buddies(this: APIThisType, { online }: buddiesProps): Promise<BuddiesType>
{
	// Run queries
	// see nodes/StatusIndicator.js
	const [buddies, [userSettings]]: [{
		buddy_user_id: number
		username: string
		last_active_time: Date | null
	}[], [{ show_staff: boolean }]] = await Promise.all([
		online ? db.query(`
			SELECT user_buddy.buddy_user_id, user_account_cache.username, users.last_active_time
			FROM user_buddy
			JOIN users ON (user_buddy.buddy_user_id = users.id)
			JOIN user_account_cache ON (users.id = user_account_cache.id)
			WHERE user_buddy.user_id = $1::int AND users.last_active_time > now() - interval '15 minutes'
			ORDER BY users.last_active_time DESC
		`, this.userId) : db.query(`
			SELECT user_buddy.buddy_user_id, user_account_cache.username, users.last_active_time
			FROM user_buddy
			JOIN users ON (user_buddy.buddy_user_id = users.id)
			JOIN user_account_cache ON (users.id = user_account_cache.id)
			WHERE user_buddy.user_id = $1::int
			ORDER BY users.last_active_time DESC
		`, this.userId),
		db.query(`
			SELECT show_staff
			FROM users
			WHERE id = $1
		`, this.userId),
	]);

	let staff: {
		id: number
		username: string
		last_active_time: Date | null
	}[] = [];

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

	return <BuddiesType>{
		buddies: buddies.length > 0 ? buddies.map(buddyUser =>
		{
			return {
				id: buddyUser.buddy_user_id,
				username: buddyUser.username,
				lastActiveTime: buddyUser.last_active_time,
			};
		}) : [],
		staff: staff.length > 0 ? staff.map(buddyUser =>
		{
			return {
				id: buddyUser.id,
				username: buddyUser.username,
				lastActiveTime: buddyUser.last_active_time,
			};
		}) : [],
	};
}

buddies.permissions = [
	'use-buddy-system',
	'userId',
];

buddies.apiTypes = {
	online: {
		type: APITypes.boolean,
		default: 'false',
	},
};

type buddiesProps = {
	online: boolean
};

export default buddies;
