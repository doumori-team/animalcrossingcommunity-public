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
	// Check parameters
	categoryName = utils.convertForUrl(categoryName);

	const sortedCategory: ACGameItemType[number][number] = (await ACCCache.get(constants.cacheKeys.sortedCategories))[categoryName];

	if (categoryName !== 'all' && !sortedCategory)
	{
		throw new UserError('no-such-catalog-category');
	}

	// Run calculations
	const categories = sortedCategory[sortBy];

	if (utils.realStringLength(name) > 0)
	{
		const doesItemMatch = (item: GroupItemType['groups'][number]['items'][number]) => item.name.localeCompare(name, undefined, { sensitivity: 'base' }) === 0;
		const doesGroupMatch = (group: GroupItemType['groups'][number]) => group.items.some(doesItemMatch);

		return (categories as GroupItemType[]).filter(catalog => catalog.groups.some(doesGroupMatch))
			.map(catalog => ({
				...catalog,
				groups: catalog.groups.filter(doesGroupMatch)
					.map(group => ({
						...group,
						items: group.items.filter(doesItemMatch),
					})),
			}));
	}
	// async Select (see TradingPost)
	else if (utils.realStringLength(query) > 0)
	{
		// have direct match show first in the list
		return (categories as ACGameItemType[number]['all']['items'])
			.filter(item => item.name.toLowerCase() === query.toLowerCase())
			.concat((categories as ACGameItemType[number]['all']['items'])
				.filter(item => item.name.toLowerCase() !== query.toLowerCase() && item.name.toLowerCase().includes(query.toLowerCase())));
	}

	return categories;
}

catalog.permissions = [
	'view-user-catalog',
	'use-trading-post',
];

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
