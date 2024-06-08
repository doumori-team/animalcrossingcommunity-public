import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import { ACCCache } from '@cache';

async function item({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'gift-bell-shop'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const item = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))['all'][id];

	if (!item || dateUtils.isAfterCurrentDateTimezone(item.releaseDate))
	{
		throw new UserError('bad-format');
	}

	return item;
}

item.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

export default item;