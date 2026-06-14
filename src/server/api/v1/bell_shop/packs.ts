import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants, dateUtils, utils } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, BellShopPackType } from '@types';

async function packs(this: APIThisType, { categoryId, debug }: packsProps): Promise<BellShopPackType[]>
{
	let packs: BellShopPackType[] = [];

	const allPacks = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))[categoryId]['packs'];

	if (!allPacks)
	{
		throw new UserError('bad-format');
	}

	outer: for (let pack of allPacks)
	{
		for (let item of pack.items)
		{
			if (!constants.LIVE_SITE && utils.realStringLength(debug) > 0)
			{
				if (!dateUtils.isValid(debug) || dateUtils.isAfterTimezone2(item.releaseDate, debug))
				{
					continue outer;
				}
			}
			else
			{
				if (dateUtils.isAfterCurrentDateTimezone(item.releaseDate))
				{
					continue outer;
				}
			}
		}

		packs.push(pack);
	}

	return packs.sort((a, b) => a.name.localeCompare(b.name));
}

packs.permissions = [
	'purchase-bell-shop',
];

packs.apiTypes = {
	categoryId: {
		type: APITypes.number,
		default: 0,
	},
	debug: {
		type: APITypes.string,
		default: '',
	},
};

type packsProps = {
	categoryId: number
	debug: string
};

export default packs;
