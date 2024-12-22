import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';
import { APIThisType } from '@types';

async function publish(this: APIThisType, { id }: publishProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'publish-guides' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

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
		UPDATE guide
		SET name = updated_name, description = updated_description, content = updated_content, last_published = now()
		WHERE id = $1::int
	`, id);

	await db.query(`
		UPDATE guide
		SET updated_name = null, updated_description = null, updated_content = null
		WHERE id = $1::int
	`, id);

	ACCCache.deleteMatch(constants.cacheKeys.guides);
	ACCCache.deleteMatch(constants.cacheKeys.acGameGuide);
}

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
