import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, UserMatchingType } from '@types';

/*
 * Find matching users based on: FCs, IPs
 */
async function matching(this: APIThisType, { username, match }: matchingProps): Promise<UserMatchingType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'process-user-tickets' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	let results = [];

	if (
		utils.realStringLength(username) > 0
	)
	{
		let matches = [];

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
			`, username);
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
			`, username);
		}

		if (matches.length > 0)
		{
			results = await Promise.all(matches.map(async (match: any) =>
			{
				return {
					user: await this.query('v1/user', { id: match.user_id }),
				};
			}));
		}
	}

	return <UserMatchingType>{
		results: results,
		username: username,
		match: match,
	};
}

matching.apiTypes = {
	username: {
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
	username: string
	match: string
};

export default matching;
