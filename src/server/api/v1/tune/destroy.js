import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function destroy({id})
{
	const [modifyTunes, processUserTickets] = await Promise.all([
		this.query('v1/permission', {permission: 'modify-tunes'}),
		this.query('v1/permission', {permission: 'process-user-tickets'}),
	]);

	if (!(modifyTunes || processUserTickets))
	{
		throw new UserError('permission');
	}

	// Check the tune id is valid
	const [tune] = await db.query(`
		SELECT creator_id
		FROM town_tune
		WHERE town_tune.id = $1::int
	`, id);

	if (!tune)
	{
		throw new UserError('no-such-tune');
	}

	if (tune.creator_id != this.userId)
	{
		throw new UserError('permission');
	}

	// Perform query
	await db.transaction(async query =>
	{
		await Promise.all([
			query(`
				UPDATE town
				SET town_tune_id = NULL
				WHERE town_tune_id = $1::int
			`, id),
			query(`
				DELETE FROM town_tune
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