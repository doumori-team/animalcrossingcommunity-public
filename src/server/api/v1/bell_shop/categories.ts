import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, BellShopCategoryType } from '@types';

async function categories(this: APIThisType): Promise<BellShopCategoryType[]>
{
	return await ACCCache.get(constants.cacheKeys.bellShopCategories);
}

categories.permissions = [
	'purchase-bell-shop',
];

export default categories;
