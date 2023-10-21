import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function destroy({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'use-friend-codes'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	let [friendCode] = await db.query(`
		SELECT user_id
		FROM friend_code
		WHERE id = $1::int
	`, id);

	if (!friendCode)
	{
		throw new UserError('no-such-friend_code');
	}

	// Check permission
	if (friendCode.user_id != this.userId)
	{
		throw new UserError('permission');
	}

	// Delete from any trades
	await db.transaction(async query =>
	{
		let [friendCodeCharacter] = await query(`
			SELECT character_id
			FROM friend_code_character
			WHERE friend_code_id = $1::int
		`, id);

		await Promise.all([
			// Delete from any trades
			friendCodeCharacter ? query(`
				UPDATE listing_offer
				SET friend_code = null
				WHERE character_id = $1::int
			`, friendCodeCharacter.character_id) : null,
			// Delete
			query(`
				DELETE FROM friend_code
				WHERE id = $1::int
			`, id),
		]);
	});
}

destroy.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default destroy;