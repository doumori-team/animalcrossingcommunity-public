import { UserError } from '@errors';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, BellShopCategoryType } from '@types';

export default async function categories(this: APIThisType): Promise<BellShopCategoryType[]>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'purchase-bell-shop' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await ACCCache.get(constants.cacheKeys.bellShopCategories);
}
