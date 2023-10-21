import * as db from '@db';
import { sortedCategories } from '@/catalog/data.js';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

/*
 * Fetches information about a user's catalog's categories.
 */
async function category({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-user-catalog'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// all categories in game
	let categories = sortedCategories['all']['theme'];

	// list of catalog item ids the character has
	const catalogItemIds = (await db.query(`
		SELECT
			user_ac_item.item_id
		FROM user_ac_item
		WHERE user_ac_item.user_id = $1::int AND user_ac_item.is_inventory = $2
	`, id, true)).map(cci => cci.item_id);

	if (catalogItemIds.length > 0)
	{
		for (let key in categories)
		{
			// all items in category that the user has
			categories[key].count = (categories[key].groups
				.map(g => g.items).flat()
				.filter(item => catalogItemIds.includes(item.id))).length;
		}
	}

	return categories;
}

category.apiTypes = {
	id: {
		type: APITypes.userId,
	},
}

export default category;