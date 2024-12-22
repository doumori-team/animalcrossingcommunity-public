import * as db from '@db';
import { APIThisType, UserLiteType } from '@types';

export default async function users(this: APIThisType): Promise<UserLiteType[]>
{
	if (!this.userId)
	{
		return [];
	}

	// Check paramters
	await this.query('v1/user_lite', { id: this.userId });

	// Perform queries
	const users = await db.query(`
		SELECT block_user.block_user_id
		FROM block_user
		WHERE block_user.user_id = $1::int
		GROUP BY block_user.block_user_id
	`, this.userId);

	return await Promise.all(users.map(async (user: any) =>
	{
		return await this.query('v1/user_lite', { id: user.block_user_id });
	}));
}
