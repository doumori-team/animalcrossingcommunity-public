import * as db from '@db';
import * as accounts from '@accounts';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, SuccessType } from '@types';

/*
 * Reset a test account's username history
 */
async function reset_username_history(this: APIThisType, { username }: resetUsernameHistory): Promise<SuccessType>
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

	// Confirm it's test account
	if (!constants.testAccounts.includes(user.id))
	{
		throw new UserError('live-username-change');
	}

	// Perform queries

	await accounts.resetUsernameHistory(user.id);

	ACCCache.deleteMatch(constants.cacheKeys.userLite);

	return {
		_success: `The user's username history has been cleared.`,
	};
}

reset_username_history.apiTypes = {
	username: {
		type: APITypes.string,
		required: true,
		length: constants.max.searchUsername,
	},
};

type resetUsernameHistory = {
	username: string
};

export default reset_username_history;
