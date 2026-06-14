import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	// Check parameters
	const [friendCode] = await db.query(`
		SELECT user_id
		FROM friend_code
		WHERE id = $1::int
	`, id);

	if (!friendCode)
	{
		throw new UserError('no-such-friend_code');
	}

	if (friendCode.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	// Delete from any trades
	await db.transaction(async (query: db.QueryType) =>
	{
		const [friendCodeCharacter] = await query(`
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

destroy.permissions = [
	'use-friend-codes',
	'userId',
];

destroy.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
