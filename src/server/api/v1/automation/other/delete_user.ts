import * as db from '@db';
import * as accounts from '@accounts';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, SuccessType } from '@types';

/*
 * Delete user (test account)
 */
async function delete_user(this: APIThisType, { username }: deleteUserProps): Promise<SuccessType>
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

	// Make sure it's not one of our certified test accounts
	// (Account side will make sure it only deletes a test account)
	if (constants.testAccounts.includes(user.id) || this.userId === user.id)
	{
		throw new UserError('bad-format');
	}

	// Perform queries

	await accounts.deleteUser(user.id);

	return {
		_success: `The user has been deleted.`,
	};
}

delete_user.permissions = [
	'TEST_SITE',
	'userId',
];

delete_user.apiTypes = {
	username: {
		type: APITypes.string,
		required: true,
		length: constants.max.searchUsername,
	},
};

type deleteUserProps = {
	username: string
};

export default delete_user;
