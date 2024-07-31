import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants, dateUtils, utils } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, BellShopItemsType, DataTagType, ShopItemsType } from '@types';

async function items(this: APIThisType, {page, categoryId, sortBy, groupBy, debug}: itemsProps) : Promise<ShopItemsType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'purchase-bell-shop'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;
	let results:any = [], count = 0;

	let items:BellShopItemsType[number] = [];

	if (!constants.LIVE_SITE && utils.realStringLength(debug) > 0)
	{
		if (!dateUtils.isValid(debug))
		{
			throw new UserError('bad-format');
		}

		items = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))[categoryId].filter((item: BellShopItemsType[number][number]) => dateUtils.isBeforeTimezone2(item.releaseDate, debug) || dateUtils.isSameTimezone2(item.releaseDate, debug));
	}
	else
	{
		items = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))[categoryId].filter((item: BellShopItemsType[number][number]) => dateUtils.isBeforeCurrentDateTimezone(item.releaseDate) || dateUtils.isSameCurrentDateTimezone(item.releaseDate));
	}

	if (!items)
	{
		throw new UserError('bad-format');
	}

	let tags:any = [];

	const categories = constants.bellShop.categories;

	if ([categories.avatarAccentsId, categories.avatarBackgroundsId, categories.avatarCharactersId].includes(categoryId))
	{
		const avatarTags:DataTagType[] = await ACCCache.get(constants.cacheKeys.avatarTags);

		avatarTags.forEach((tag:DataTagType) => {
			if (
				tag.id !== 'bell-shop' &&
				((tag.forCharacter && categoryId === categories.avatarCharactersId && items.some(i => i.avatar?.character?.tags.includes(tag.id))) ||
				(tag.forAccent && categoryId === categories.avatarAccentsId && items.some(i => i.avatar?.accent?.tags.includes(tag.id))) ||
				(tag.forBackground && categoryId === categories.avatarBackgroundsId && items.some(i => i.avatar?.background?.tags.includes(tag.id))))
			)
			{
				tags.push({
					id: tag.id,
					name: tag.name
				});
			}
		});
	}

	if (utils.realStringLength(groupBy) > 0 && !tags.find((t:any) => t.id === groupBy))
	{
		throw new UserError('bad-format');
	}

	if (utils.realStringLength(groupBy) > 0)
	{
		switch (categoryId)
		{
			case categories.avatarAccentsId:
				items = items.filter(i => i.avatar?.accent?.tags.includes(groupBy));
				break;
			case categories.avatarBackgroundsId:
				items = items.filter(i => i.avatar?.background?.tags.includes(groupBy));
				break;
			case categories.avatarCharactersId:
				items = items.filter(i => i.avatar?.character?.tags.includes(groupBy));
				break;
		}
	}

	switch (sortBy)
	{
		case 'date':
			items = items.sort((a, b) => {
				return dateUtils.toDate(b.releaseDate).getTime() - dateUtils.toDate(a.releaseDate).getTime();
			});

			break;
		case 'price':
			items = items.sort((a, b) => a.prices[0].nonFormattedPrice - b.prices[0].nonFormattedPrice);

			break;
		case 'name':
			items = items.sort((a, b) => a.name.localeCompare(b.name));

			break;
	}

	if (items)
	{
		results = items.slice(offset, offset+pageSize);

		count = Number(items.length);
	}

	return <ShopItemsType>{
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		sortBy: sortBy,
		groupBy: groupBy,
		tags: tags.sort((a:any, b:any) => a.name.localeCompare(b.name)),
	};
}

items.apiTypes = {
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	categoryId: {
		type: APITypes.number,
		default: 0,
	},
	sortBy: {
		type: APITypes.string,
		includes: ['date', 'price', 'name'],
		required: true,
		default: 'date',
	},
	groupBy: {
		type: APITypes.string,
	},
	debug: {
		type: APITypes.string,
		default: '',
	},
}

type itemsProps = {
	page: number
	categoryId: number
	sortBy: 'date' | 'price' | 'name'
	groupBy: string
	debug: string
}

export default items;