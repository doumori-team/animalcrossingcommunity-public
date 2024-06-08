import { UserError } from '@errors';
import { constants } from '@utils';
import { ACCCache } from '@cache';

export default async function categories()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'purchase-bell-shop'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await ACCCache.get(constants.cacheKeys.bellShopCategories);
}