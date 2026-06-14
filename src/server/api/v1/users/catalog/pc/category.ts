import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, UserCatalogCategoryType } from '@types';

/*
 * Fetches information about a user's catalog's categories (Pocket Camp).
 */
async function category(this: APIThisType, { id }: categoryProps): Promise<UserCatalogCategoryType>
{
	// all categories in game
	let categories: UserCatalogCategoryType = await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${constants.gameIds.ACPC}_all_theme`);

	// list of catalog item ids the character has
	const catalogItemIds = (await db.query(`
		SELECT pc_catalog_item.catalog_item_id
		FROM pc_catalog_item
		WHERE pc_catalog_item.user_id = $1::int AND pc_catalog_item.is_inventory = $2
	`, id, true)).map((cci: { catalog_item_id: string }) => cci.catalog_item_id);

	if (catalogItemIds.length > 0)
	{
		for (let key in categories)
		{
			// all items in category that the user has
			categories[key].count = categories[key].groups
				.map(g => g.items).flat()
				.filter(item => catalogItemIds.includes(item.id)).length;
		}
	}

	return categories;
}

category.permissions = [
	'view-user-catalog',
];

category.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
};

type categoryProps = {
	id: number
};

export default category;
