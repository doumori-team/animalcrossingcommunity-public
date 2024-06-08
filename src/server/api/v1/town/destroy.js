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

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const [town] = await db.query(`
		SELECT id, user_id
		FROM town
		WHERE town.id = $1::int
	`, id);

	if (town.user_id != this.userId)
	{
		throw new UserError('permission');
	}

	await db.transaction(async query =>
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

destroy.apiTypes = {
	id: {
		type: APITypes.townId,
	},
}

export default destroy;