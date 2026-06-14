import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	const [town] = await db.query(`
		SELECT id, user_id
		FROM town
		WHERE town.id = $1::int
	`, id);

	if (town.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	await db.transaction(async (query: db.QueryType) =>
	{
		// update any trades using this character; see v1/character/destroy.js
		await query(`
			UPDATE listing_offer
			SET character_id = NULL
			WHERE character_id IN (SELECT id FROM character WHERE town_id = $1::int)
		`, id);

		await query(`
			DELETE FROM town
			WHERE id = $1::int
		`, id);
	});
}

destroy.permissions = [
	'modify-towns',
	'process-user-tickets',
	'userId',
];

destroy.apiTypes = {
	id: {
		type: APITypes.townId,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
