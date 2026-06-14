import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
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

	if (tune.creator_id !== this.userId)
	{
		throw new UserError('permission');
	}

	// Perform query
	await db.transaction(async (query: db.QueryType) =>
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

destroy.permissions = [
	'modify-tunes',
	'process-user-tickets',
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
