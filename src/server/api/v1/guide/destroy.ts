import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	const [guide] = await db.query(`
		SELECT id
		FROM guide
		WHERE id = $1::int
	`, id);

	if (!guide)
	{
		throw new UserError('no-such-guide');
	}

	await db.query(`
		DELETE FROM guide
		WHERE id = $1::int
	`, id);

	ACCCache.deleteMatch(constants.cacheKeys.guides);
	ACCCache.deleteMatch(constants.cacheKeys.acGameGuide);
}

destroy.permissions = [
	'publish-guides',
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
