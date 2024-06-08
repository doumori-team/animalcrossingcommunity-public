import { UserError } from '@errors';
import { utils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { ACCCache } from '@cache';

/*
 * Fetches information about a game's catalog.
 */
async function catalog({id, categoryName, sortBy, name, query})
{
	const [viewTownsPerm, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'view-towns'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
	]);

	if (!(viewTownsPerm || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

	let museum = false;

	if (categoryName === 'museum')
	{
		categoryName = 'all';
		museum = true;
	}

	let acgameCategories = await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${id}_${categoryName}_${sortBy}`);

	// Check parameters
	if (categoryName !== 'all' && !acgameCategories)
	{
		throw new UserError('no-such-catalog-category');
	}

	// Run calculations
	if (museum)
	{
		const doesItemMatch = (item) => item.museum && item.genuine;
		const doesGroupMatch = (group) => group.items.some(doesItemMatch);

		acgameCategories = acgameCategories.filter((catalog) => catalog.groups.some(doesGroupMatch))
			.map((catalog) => ({
				...catalog,
				groups: catalog.groups.filter(doesGroupMatch)
					.map((group) => ({
						...group,
						items: group.items.filter(doesItemMatch)
					}))
			}));
	}

	if (utils.realStringLength(name) > 0)
	{
		const doesItemMatch = (item) => item.name.localeCompare(name, undefined, { sensitivity: 'base' }) === 0;
		const doesGroupMatch = (group) => group.items.some(doesItemMatch);

		return acgameCategories.filter((catalog) => catalog.groups.some(doesGroupMatch))
			.map((catalog) => ({
				...catalog,
				groups: catalog.groups.filter(doesGroupMatch)
					.map((group) => ({
						...group,
						items: group.items.filter(doesItemMatch)
					}))
			}));
	}
	else if (utils.realStringLength(query) > 0)
	{
		// have direct match show first in the list
		return acgameCategories.filter(item => item.name.toLowerCase() === query.toLowerCase()).concat(acgameCategories.filter(item => item.name.toLowerCase() !== query.toLowerCase() && item.name.toLowerCase().includes(query.toLowerCase())));
	}

	return acgameCategories;
}

catalog.apiTypes = {
	id: {
		type: APITypes.acgameId,
		required: true,
	},
	categoryName: {
		type: APITypes.string,
		required: true,
	},
	sortBy: {
		type: APITypes.string,
		default: 'items',
		includes: ['theme', 'catalog', 'alphabetical', 'items'],
		required: true,
	},
	name: {
		type: APITypes.string,
		default: '',
		length: constants.max.itemName,
	},
	query: {
		type: APITypes.string,
		min: 3,
		default: '',
		nullable: true,
	},
}

export default catalog;