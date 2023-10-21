import { UserError } from '@errors';
import { utils, constants } from '@utils';
import { sortedAcGameCategories as sortedCategories } from '@/catalog/data.js';
import * as APITypes from '@apiTypes';

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

	// Check parameters
	if (categoryName !== 'all' && !sortedCategories[id][categoryName])
	{
		throw new UserError('no-such-catalog-category');
	}

	// Run calculations
	const acgameCategories = sortedCategories[id][categoryName][sortBy];

	if (utils.realStringLength(name) > 0)
	{
		const doesItemMatch = (item) => item.name.includes(name);
		const doesGroupMatch = (group) => group.items.some(doesItemMatch);

		return acgameCategories.filter((catalog) => catalog.groups.some(doesGroupMatch))
			.map((catalog) => ({
				...catalog,
				groups: catalog.groups.filter(doesGroupMatch)
					.map((group) => ({
						...group,
						items: group.items.filter(doesItemMatch)
					}))
			}))
	}
	else if (utils.realStringLength(query) > 0)
	{
		return acgameCategories.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
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