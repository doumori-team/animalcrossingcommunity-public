import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function reset(this: APIThisType, { username }: resetProps): Promise<SuccessType>
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
		DELETE FROM user_bell_shop_redeemed
		WHERE user_id = $1::int
	`, user.id);

	return {
		_success: `The user's purchases have been reset.`,
	};
}

reset.apiTypes = {
	username: {
		type: APITypes.string,
		required: true,
	},
};

type resetProps = {
	username: string
};

export default reset;
