import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType, UsersType } from '@types';

async function users(this: APIThisType, { query }: usersProps): Promise<UsersType[]>
{
	if (!this.userId)
	{
		return [];
	}

	return await db.query(`
		SELECT user_account_cache.id, user_account_cache.username
		FROM user_account_cache
		WHERE username ilike $1
	`, `%${query}%`);
}

users.apiTypes = {
	query: {
		type: APITypes.string,
		min: 3,
		required: true,
	},
};

type usersProps = {
	query: string
};

export default users;
