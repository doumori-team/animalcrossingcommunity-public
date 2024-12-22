import * as accounts from '@accounts';
import { constants } from '@utils';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, SuccessType } from '@types';

async function save(this: APIThisType, { username }: saveProps): Promise<SuccessType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'change-username' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	if (!username.match(RegExp(constants.regexes.nonWhitespaceCharacters)))
	{
		throw new UserError('bad-format');
	}

	// Confirm test-account only on test sites
	if (!constants.LIVE_SITE && !constants.testAccounts.includes(this.userId))
	{
		throw new UserError('live-username-change');
	}

	// Confirm user hasn't maxed out changes
	const userData = await accounts.getUserData(this.userId);

	if (userData.username_history.length >= 3)
	{
		throw new UserError('max-username-changes');
	}

	// Confirm username is free (current user OR username change)
	try
	{
		await accounts.getUserData(null, username);

		throw new UserError('username-taken');
	}
	catch (error: any)
	{
		if (error.name === 'UserError' && error.identifiers.includes('no-such-user'))
		{
			// it's supposed to error because no user found with that username, we can continue
		}
		else
		{
			// Not this function's problem then, so pass it on.
			throw error;
		}
	}

	await accounts.pushData(
		{
			user_id: userData.id,
			username: username,
		});

	ACCCache.deleteMatch(constants.cacheKeys.userLite);

	return { _success: 'Your username has been updated.' };
}

save.apiTypes = {
	username: {
		type: APITypes.string,
		required: true,
		profanity: true,
		regex: constants.regexes.username,
		length: constants.max.username,
		min: constants.min.username,
	},
};

type saveProps = {
	username: string
};

export default save;
