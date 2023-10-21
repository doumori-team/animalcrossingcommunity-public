import * as db from '@db';
import { UserError } from '@errors';

export default async function users()
{
	if (!this.userId)
	{
		return [];
	}

	// Check paramters
	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Perform queries
	const users = await db.query(`
		SELECT block_user.block_user_id
		FROM block_user
		WHERE block_user.user_id = $1::int
		GROUP BY block_user.block_user_id
	`, this.userId);

	return await Promise.all(users.map(async(user) => {
		const userObj = await this.query('v1/user_lite', {id: user.block_user_id});

		return {
			id: userObj.id,
			username: userObj.username,
		}
	}));
}