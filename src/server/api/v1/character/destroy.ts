import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	const [modifyTowns, processUserTickets] = await Promise.all([
		this.query('v1/permission', { permission: 'modify-towns' }),
		this.query('v1/permission', { permission: 'process-user-tickets' }),
	]);

	if (!(modifyTowns || processUserTickets))
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const [character] = await db.query(`
		SELECT town.user_id
		FROM character
		JOIN town ON (town.id = character.town_id)
		WHERE character.id = $1::int
	`, id);

	if (character.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	// Perform queries
	await db.transaction(async (query: any) =>
	{
		// update any trades using this character; see v1/town/destroy.js
		await query(`
			UPDATE listing_offer
			SET character_id = null
			WHERE character_id = $1::int
		`, id);

		await query(`
			DELETE FROM character
			WHERE id = $1::int
		`, id);
	});
}

destroy.apiTypes = {
	id: {
		type: APITypes.characterId,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
