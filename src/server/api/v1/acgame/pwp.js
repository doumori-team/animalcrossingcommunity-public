import { getPWPs } from '@/catalog/info.js';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function pwp({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return getPWPs(id);
}

pwp.apiTypes = {
	id: {
		type: APITypes.acgameId,
	},
}

export default pwp;
