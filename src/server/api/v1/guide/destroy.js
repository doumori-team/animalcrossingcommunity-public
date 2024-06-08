import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { constants } from '@utils';

async function destroy({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'publish-guides'});

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
		DELETE FROM guide
		WHERE id = $1::int
	`, id);

	ACCCache.deleteMatch(constants.cacheKeys.guides);
	ACCCache.deleteMatch(constants.cacheKeys.acGameGuide);
}

destroy.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default destroy;