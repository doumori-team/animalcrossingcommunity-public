import * as db from '@db';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserMatchingType } from '@types';

/*
 * Find matching users based on: FCs, IPs
 */
async function matching(this: APIThisType, { searchUser, match }: matchingProps): Promise<UserMatchingType>
{
	let results: UserMatchingType['results'] = [];

	if (
		utils.realStringLength(searchUser) > 0
	)
	{
		let matches: { user_id: number }[] = [];

		if (match === constants.matching.friendCodes)
		{
			matches = await db.query(`
				SELECT
					dup_fc.user_id
				FROM friend_code
				JOIN friend_code AS dup_fc ON (
					dup_fc.friend_code = friend_code.friend_code AND
					dup_fc.game_id = friend_code.game_id AND
					dup_fc.user_id != friend_code.user_id
				)
				JOIN user_account_cache ON (friend_code.user_id = user_account_cache.id)
				WHERE LOWER(user_account_cache.username) = LOWER($1)
			`, searchUser);
		}
		else if (match === constants.matching.ipAddresses)
		{
			matches = await db.query(`
				SELECT
					dup_ip.user_id
				FROM user_ip_address
				JOIN user_ip_address AS dup_ip ON (
					dup_ip.ip_address = user_ip_address.ip_address AND
					dup_ip.user_id != user_ip_address.user_id
				)
				JOIN user_account_cache ON (user_ip_address.user_id = user_account_cache.id)
				WHERE LOWER(user_account_cache.username) = LOWER($1)
			`, searchUser);
		}

		if (matches.length > 0)
		{
			results = await Promise.all(matches.map(async match =>
			{
				return {
					user: await this.query('v1/user', { id: match.user_id }),
				};
			}));
		}
	}

	return <UserMatchingType>{
		results: results,
		searchUser: searchUser,
		match: match,
	};
}

matching.permissions = [
	'process-user-tickets',
];

matching.apiTypes = {
	searchUser: {
		type: APITypes.string,
		default: '',
		length: constants.max.searchUsername,
	},
	match: {
		type: APITypes.string,
		default: constants.matching.friendCodes,
		includes: Object.values(constants.matching),
	},
};

type matchingProps = {
	searchUser: string
	match: string
};

export default matching;
