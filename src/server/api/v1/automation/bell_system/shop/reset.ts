import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

async function reset(this: APIThisType, { username }: resetProps): Promise<SuccessType>
{
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

reset.permissions = [
	'TEST_SITE',
	'userId',
];

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
