import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

/*
 * Remove all bans for a user
 */
async function remove_ban(this: APIThisType, {username}: removeBanProps) : Promise<SuccessType>
{
	// You must be logged in and on a test site
	if (constants.LIVE_SITE)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters

	const [user] = await db.query(`
		SELECT id
		FROM user_account_cache
		WHERE LOWER(username) = LOWER($1)
	`, username);

	if (!user)
	{
		throw new UserError('no-such-user');
	}

	// Perform queries

	await db.query(`
		UPDATE users
		SET current_ban_length_id = null
		WHERE id = $1::int
	`, user.id);

	return {
		_success: `The ban has been removed!`
	};
}

remove_ban.apiTypes = {
	username: {
		type: APITypes.string,
		required: true,
		length: constants.max.searchUsername,
	},
}

type removeBanProps = {
	username: string
}

export default remove_ban;