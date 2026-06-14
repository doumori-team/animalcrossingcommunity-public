import * as accounts from '@accounts';
import { constants } from '@utils';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, SuccessType } from '@types';

async function save(this: APIThisType, { newUser }: saveProps): Promise<SuccessType>
{
	if (!newUser.match(RegExp(constants.regexes.nonWhitespaceCharacters)))
	{
		throw new UserError('bad-format');
	}

	// Confirm test-account only on test sites
	if (!constants.LIVE_SITE && !constants.testAccounts.includes(this.userId as number))
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
		await accounts.getUserData(null, newUser);

		throw new UserError('username-taken');
	}
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
			username: newUser,
		});

	ACCCache.deleteMatch(constants.cacheKeys.userLite);

	return { _success: 'Your username has been updated.' };
}

save.permissions = [
	'change-username',
	'userId',
];

save.apiTypes = {
	newUser: {
		type: APITypes.string,
		required: true,
		profanity: true,
		regex: constants.regexes.username,
		length: constants.max.username,
		min: constants.min.username,
	},
};

type saveProps = {
	newUser: string
};

export default save;
