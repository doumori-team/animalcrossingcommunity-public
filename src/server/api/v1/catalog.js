import { UserError } from '@errors';
import { utils } from '@utils';
import { sortedCategories } from '@/catalog/data.js';
import * as APITypes from '@apiTypes';

/*
 * Fetches information about 'real-world' items.
 */
async function catalog({categoryName, sortBy, name})
{
	const [viewUserCatalogPerm, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'view-user-catalog'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
	]);

	if (!(viewUserCatalogPerm || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

	// Check parameters
	categoryName = utils.convertForUrl(categoryName);

	if (categoryName !== 'all' && !sortedCategories[categoryName])
	{
		throw new UserError('no-such-catalog-category');
	}

	// Run calculations
	const categories = sortedCategories[categoryName][sortBy];

	if (utils.realStringLength(name) > 0)
	{
		const doesItemMatch = (item) => item.name.includes(name);
		const doesGroupMatch = (group) => group.items.some(doesItemMatch);

		return categories.filter((catalog) => catalog.groups.some(doesGroupMatch))
			.map((catalog) => ({
				...catalog,
				groups: catalog.groups.filter(doesGroupMatch)
					.map((group) => ({
						...group,
						items: group.items.filter(doesItemMatch)
					}))
			}))
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
}

export default catalog;