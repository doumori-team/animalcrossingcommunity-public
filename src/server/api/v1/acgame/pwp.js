import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { ACCCache } from '@cache';

async function pwp({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return (await ACCCache.get(constants.cacheKeys.pwps))[id];
}

pwp.apiTypes = {
	id: {
		type: APITypes.acgameId,
	},
}

export default pwp;
