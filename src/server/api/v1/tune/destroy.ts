import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	const [modifyTunes, processUserTickets] = await Promise.all([
		this.query('v1/permission', { permission: 'modify-tunes' }),
		this.query('v1/permission', { permission: 'process-user-tickets' }),
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
	await db.transaction(async (query: any) =>
	{
		await query(`
			UPDATE town
			SET town_tune_id = NULL
			WHERE town_tune_id = $1::int
		`, id);

		await query(`
			DELETE FROM town_tune
			WHERE id = $1::int
		`, id);
	});

	ACCCache.deleteMatch(constants.cacheKeys.tunes);
}

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
