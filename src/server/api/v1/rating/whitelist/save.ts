import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, { whitelistUserId }: saveProps): Promise<void>
{
	// Check if user already has whitelisted user
	let [whitelist] = await db.query(`
		SELECT id
		FROM wifi_rating_whitelist
		WHERE user_id = $1::int AND whitelist_user_id = $2::int
	`, this.userId, whitelistUserId);

	// Perform queries
	if (whitelist)
	{
		return;
	}

	await db.query(`
		INSERT INTO wifi_rating_whitelist (user_id, whitelist_user_id)
		VALUES ($1::int, $2::int)
	`, this.userId, whitelistUserId);
}

save.permissions = [
	'use-friend-codes',
	'userId',
];

save.apiTypes = {
	whitelistUserId: {
		type: APITypes.userId,
		required: true,
	},
};

type saveProps = {
	whitelistUserId: number
};

export default save;
