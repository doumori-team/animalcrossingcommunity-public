import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

/*
 * Whether the logged-in user is on this user's whitelist and has given this user whitelist to rate.
 */
async function have_whitelisted(this: APIThisType, {id}: haveWhitelistedProps) : Promise<boolean>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'use-friend-codes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	await this.query('v1/user_lite', {id: this.userId});

	if (id === this.userId)
	{
		return true;
	}

	// Only if user you're looking at has whitelisted you
	let [whitelist] = await db.query(`
		SELECT id
		FROM friend_code_whitelist
		WHERE user_id = $1::int AND whitelist_user_id = $2::int
	`, id, this.userId);

	if (!whitelist)
	{
		[whitelist] = await db.query(`
			SELECT id
			FROM friend_code_whitelist
			WHERE user_id = $1::int AND whitelist_user_id = $2::int
		`, this.userId, id);

		if (!whitelist)
		{
			[whitelist] = await db.query(`
				SELECT id
				FROM wifi_rating_whitelist
				WHERE (user_id = $1::int AND whitelist_user_id = $2::int) OR (user_id = $2::int AND whitelist_user_id = $1::int)
			`, id, this.userId);

			if (!whitelist)
			{
				return false;
			}
		}

		return true;
	}

	// Only if you have rate whitelisted them
	[whitelist] = await db.query(`
		SELECT id
		FROM wifi_rating_whitelist
		WHERE user_id = $1::int AND whitelist_user_id = $2::int
	`, this.userId, id);

	if (whitelist)
	{
		return true;
	}

	return false;
}

have_whitelisted.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
}

type haveWhitelistedProps = {
	id: number
}

export default have_whitelisted;