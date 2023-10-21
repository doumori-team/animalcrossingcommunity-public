import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

/*
 * Fetches information about current ban length.
 */
async function ban_length({id})
{
	if (id !== this.userId)
	{
		const permissionGranted = await this.query('v1/permission', {permission: 'process-user-tickets'});

		if (!permissionGranted)
		{
			throw new UserError('permission');
		}
	}

	// Perform queries
	const banLength = await db.query(`
		SELECT
			ban_length.id,
			ban_length.description,
			ban_length.days
		FROM users
		JOIN ban_length ON (users.current_ban_length_id = ban_length.id)
		WHERE users.id = $1::int
	`, id);

	if (banLength.length > 0)
	{
		return banLength.pop();
	}

	return null;
}

ban_length.apiTypes = {
	id: {
		type: APITypes.userId,
	},
}

export default ban_length;