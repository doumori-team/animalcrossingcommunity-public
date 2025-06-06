import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';
import { APIThisType, ACGameItemType, GroupItemType } from '@types';

/*
 * Fetches information about 'real-world' items.
 */
async function catalog(this: APIThisType, { categoryName, sortBy, name, query }: catalogProps): Promise<GroupItemType[] | ACGameItemType[number]['all']['items']>
{
	const [viewUserCatalogPerm, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', { permission: 'view-user-catalog' }),
		this.query('v1/permission', { permission: 'use-trading-post' }),
	]);

	if (!(viewUserCatalogPerm || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

	// Check parameters
	categoryName = utils.convertForUrl(categoryName);

	const sortedCategory: any = (await ACCCache.get(constants.cacheKeys.sortedCategories))[categoryName];

	if (categoryName !== 'all' && !sortedCategory)
	{
		throw new UserError('no-such-catalog-category');
	}

	// Run calculations
	const categories: GroupItemType[] | ACGameItemType[number]['all']['items'] = sortedCategory[sortBy];

	if (utils.realStringLength(name) > 0)
	{
		const doesItemMatch = (item: any) => item.name.localeCompare(name, undefined, { sensitivity: 'base' }) === 0;
		const doesGroupMatch = (group: any) => group.items.some(doesItemMatch);

		return (categories as GroupItemType[]).filter((catalog: any) => catalog.groups.some(doesGroupMatch))
			.map((catalog: any) => ({
				...catalog,
				groups: catalog.groups.filter(doesGroupMatch)
					.map((group: any) => ({
						...group,
						items: group.items.filter(doesItemMatch),
					})),
			}));
	}
	// async Select (see TradingPost)
	else if (utils.realStringLength(query) > 0)
	{
		// have direct match show first in the list
		return (categories as GroupItemType[])
			.filter((item: any) => item.name.toLowerCase() === query.toLowerCase())
			.concat((categories as GroupItemType[])
				.filter((item: any) => item.name.toLowerCase() !== query.toLowerCase() && item.name.toLowerCase().includes(query.toLowerCase())));
	}

	return categories;
}

catalog.apiTypes = {
	categoryName: {
		type: APITypes.string,
		default: '',
		required: true,
	},
	sortBy: {
		type: APITypes.string,
		default: '',
		includes: ['theme', 'alphabetical', 'items'],
		required: true,
	},
	name: {
		type: APITypes.string,
		default: '',
	},
	query: {
		type: APITypes.string,
		min: 3,
		default: '',
		nullable: true,
	},
};

type catalogProps = {
	categoryName: string
	sortBy: string
	name: string
	query: string
};

export default catalog;
