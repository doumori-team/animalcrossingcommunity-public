import * as db from '@db';
import * as APITypes from '@apiTypes';

async function users({query})
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
}

export default users;