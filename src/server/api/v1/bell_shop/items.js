import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants, dateUtils, utils } from '@utils';
import { ACCCache } from '@cache';

async function items({page, categoryId, sortBy, groupBy, debug})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'purchase-bell-shop'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;
	let results = [], count = 0;

	let items = null;

	if (!constants.LIVE_SITE && utils.realStringLength(debug) > 0)
	{
		if (!dateUtils.isValid(debug))
		{
			throw new UserError('bad-format');
		}

		items = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))[categoryId].filter(item => dateUtils.isBeforeTimezone2(item.releaseDate, debug) || dateUtils.isSameTimezone2(item.releaseDate, debug));
	}
	else
	{
		items = (await ACCCache.get(constants.cacheKeys.sortedBellShopItems))[categoryId].filter(item => dateUtils.isBeforeCurrentDateTimezone(item.releaseDate) || dateUtils.isSameCurrentDateTimezone(item.releaseDate));
	}

	if (!items)
	{
		throw new UserError('bad-format');
	}

	let tags = [];

	const categories = constants.bellShop.categories;

	if ([categories.avatarAccentsId, categories.avatarBackgroundsId, categories.avatarCharactersId].includes(categoryId))
	{
		const avatarTags = await ACCCache.get(constants.cacheKeys.avatarTags);

		avatarTags.forEach(tag => {
			if (
				tag.id !== 'bell-shop' &&
				((tag.forCharacter && categoryId === categories.avatarCharactersId && items.some(i => i.avatar.character.tags.includes(tag.id))) ||
				(tag.forAccent && categoryId === categories.avatarAccentsId && items.some(i => i.avatar.accent.tags.includes(tag.id))) ||
				(tag.forBackground && categoryId === categories.avatarBackgroundsId && items.some(i => i.avatar.background.tags.includes(tag.id))))
			)
			{
				tags.push({
					id: tag.id,
					name: tag.name
				});
			}
		});
	}

	if (utils.realStringLength(groupBy) > 0 && !tags.find(t => t.id === groupBy))
	{
		throw new UserError('bad-format');
	}

	if (utils.realStringLength(groupBy) > 0)
	{
		switch (categoryId)
		{
			case categories.avatarAccentsId:
				items = items.filter(i => i.avatar.accent.tags.includes(groupBy));
				break;
			case categories.avatarBackgroundsId:
				items = items.filter(i => i.avatar.background.tags.includes(groupBy));
				break;
			case categories.avatarCharactersId:
				items = items.filter(i => i.avatar.character.tags.includes(groupBy));
				break;
		}
	}

	switch (sortBy)
	{
		case 'date':
			items = items.sort((a, b) => {
				return dateUtils.toDate(b.releaseDate) - dateUtils.toDate(a.releaseDate);
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

	return {
		results: results,
		count: count,
		page: page,
		pageSize: pageSize,
		sortBy: sortBy,
		groupBy: groupBy,
		tags: tags.sort((a, b) => a.name.localeCompare(b.name)),
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

export default items;