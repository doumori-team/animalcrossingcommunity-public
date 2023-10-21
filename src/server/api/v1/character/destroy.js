import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function destroy({id})
{
	const [modifyTowns, processUserTickets] = await Promise.all([
		this.query('v1/permission', {permission: 'modify-towns'}),
		this.query('v1/permission', {permission: 'process-user-tickets'}),
	]);

	if (!(modifyTowns || processUserTickets))
	{
		throw new UserError('permission');
	}

	const [character] = await db.query(`
		SELECT character.id, town.user_id
		FROM character
		JOIN town ON (town.id = character.town_id)
		WHERE character.id = $1::int
	`, id);

	if (character.user_id != this.userId)
	{
		throw new UserError('permission');
	}

	await db.transaction(async query =>
	{
		await Promise.all([
			// update any trades using this character
			query(`
				UPDATE listing_offer
				SET character_id = null
				WHERE character_id = $1::int
			`, id),
			query(`
				DELETE FROM character
				WHERE id = $1::int
			`, id),
		]);
	});
}

destroy.apiTypes = {
	id: {
		type: APITypes.characterId,
	},
}

export default destroy;