import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	const [pattern] = await db.query(`
		SELECT creator_id
		FROM pattern
		WHERE pattern.id = $1::int
	`, id);

	if (pattern.creator_id !== this.userId)
	{
		throw new UserError('permission');
	}

	await db.transaction(async (query: db.QueryType) =>
	{
		await Promise.all([
			query(`
				UPDATE town
				SET flag_id = NULL
				WHERE flag_id = $1::int
			`, id),
			query(`
				UPDATE character
				SET door_pattern_id = NULL
				WHERE door_pattern_id = $1::int
			`, id),
			query(`
				DELETE FROM pattern
				WHERE id = $1::int
			`, id),
		]);
	});

	ACCCache.deleteMatch(constants.cacheKeys.patterns);
}

destroy.permissions = [
	'modify-patterns',
	'userId',
];

destroy.apiTypes = {
	id: {
		type: APITypes.patternId,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
