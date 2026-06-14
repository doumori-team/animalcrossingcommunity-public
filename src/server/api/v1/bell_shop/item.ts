import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, BellShopItemsType } from '@types';

async function item(this: APIThisType, { id }: itemProps): Promise<BellShopItemsType['all'][number]>
{
	const item: BellShopItemsType['all'][number] = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))['all'][id];

	if (!item || dateUtils.isAfterCurrentDateTimezone(item.releaseDate))
	{
		throw new UserError('bad-format');
	}

	return item;
}

item.permissions = [
	'gift-bell-shop',
];

item.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type itemProps = {
	id: number
};

export default item;
