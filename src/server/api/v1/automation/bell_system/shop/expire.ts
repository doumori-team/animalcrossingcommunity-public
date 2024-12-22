import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function expire(this: APIThisType, { username }: expireProps): Promise<SuccessType>
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
		UPDATE user_bell_shop_redeemed
		SET expires = now() - interval '1 month'
		WHERE user_id = $1::int
	`, user.id);

	return {
		_success: `The user's purchases have been expired.`,
	};
}

expire.apiTypes = {
	username: {
		type: APITypes.string,
		required: true,
	},
};

type expireProps = {
	username: string
};

export default expire;
