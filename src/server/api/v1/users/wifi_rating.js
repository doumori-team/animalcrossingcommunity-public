import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function wifi_rating({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-friend-codes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');	
	}

	// Check parameters
	const givenUser = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(givenUser) === 'undefined' || givenUser.length === 0)
	{
		throw new UserError('no-such-user');
	}

	// Confirm whitelists
	let [whitelist] = await db.query(`
		SELECT
			id
		FROM friend_code_whitelist
		WHERE user_id = $1::int AND whitelist_user_id = $2::int
	`, id, this.userId);

	if (!whitelist)
	{
		[whitelist] = await db.query(`
			SELECT
				id
			FROM wifi_rating_whitelist
			WHERE (user_id = $1::int AND whitelist_user_id = $2::int) OR (user_id = $2::int AND whitelist_user_id = $1::int)
		`, id, this.userId);
	}
	else
	{
		[whitelist] = await db.query(`
			SELECT
				id
			FROM friend_code_whitelist
			WHERE user_id = $1::int AND whitelist_user_id = $2::int
		`, this.userId, id);

		if (!whitelist)
		{
			[whitelist] = await db.query(`
				SELECT
					id
				FROM wifi_rating_whitelist
				WHERE user_id = $1::int AND whitelist_user_id = $2::int
			`, this.userId, id);
		}
	}

	if (!whitelist)
	{
		return null;
	}

	// Perform queries
	const [rating] = await db.query(`
		SELECT
			rating.id
		FROM rating
		WHERE rating.user_id = $1::int AND rating.rating_user_id = $2::int AND listing_id IS NULL
	`, this.userId, id);

	if (rating)
	{
		return await this.query('v1/rating', {id: rating.id});
	}

	return {};
}

wifi_rating.apiTypes = {
	id: {
		type: APITypes.userId,
	},
}

export default wifi_rating;