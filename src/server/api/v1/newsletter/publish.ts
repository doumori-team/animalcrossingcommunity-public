import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

async function publish(this: APIThisType, { id }: publishProps): Promise<void>
{
	const [newsletter] = await db.query(`
		SELECT published
		FROM newsletter
		WHERE id = $1::int
	`, id);

	if (!newsletter)
	{
		throw new UserError('no-such-newsletter');
	}

	if (newsletter.published !== null)
	{
		throw new UserError('bad-format');
	}

	await db.query(`
		UPDATE newsletter
		SET published = now()
		WHERE id = $1::int
	`, id);

	ACCCache.deleteMatch(constants.cacheKeys.newsletter);
}

publish.permissions = [
	'publish-newsletter',
];

publish.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type publishProps = {
	id: number
};

export default publish;
