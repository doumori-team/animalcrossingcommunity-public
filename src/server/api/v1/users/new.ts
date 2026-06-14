import * as db from '@db';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UsersNewType } from '@types';

/*
 * All new users, with info.
 */
async function users_new(this: APIThisType, { page }: usersNewProps): Promise<UsersNewType>
{
	// Perform queries
	const pageSize = 24;
	const offset = page * pageSize - pageSize;

	const newUsers: {
		id: number
		signup_date: string
		username: string
		last_active_time: Date | null
		scout_id: number | null
		scout_username: string | null
		adopted: Date | null
		count: number
	}[] = await db.query(`
		SELECT
			user_account_cache.id,
			user_account_cache.signup_date,
			user_account_cache.username,
			users.last_active_time,
			scout_user_account_cache.id AS scout_id,
			scout_user_account_cache.username AS scout_username,
			adoption.adopted,
			count(*) over() AS count
		FROM user_account_cache
		JOIN users ON (users.id = user_account_cache.id)
		LEFT JOIN adoption ON (user_account_cache.id = adoption.adoptee_id)
		LEFT JOIN user_account_cache AS scout_user_account_cache ON (scout_user_account_cache.id = adoption.scout_id)
		WHERE user_account_cache.signup_date > (current_date - interval '1 day' * $3)
		ORDER BY user_account_cache.signup_date DESC, user_account_cache.id DESC
		LIMIT $1::int OFFSET $2::int
	`, pageSize, offset, constants.scoutHub.newMemberEligibility);

	return <UsersNewType>{
		newUsers: newUsers.map(user =>
		{
			return {
				id: user.id,
				username: user.username,
				signupDate: user.signup_date,
				adopted: user.adopted ? dateUtils.formatDateTime5(user.adopted) : '',
				lastActiveTime: user.last_active_time,
				scoutId: user.scout_id,
				scoutUsername: user.scout_username,
			};
		}),
		totalCount: newUsers.length > 0 ? Number(newUsers[0].count) : 0,
		page: page,
		pageSize: pageSize,
	};
}

users_new.permissions = [
	'scout-pages',
];

users_new.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
};

type usersNewProps = {
	page: number
};

export default users_new;
