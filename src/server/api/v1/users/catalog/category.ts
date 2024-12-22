import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, UserCatalogCategoryType } from '@types';

/*
 * Fetches information about a user's catalog's categories.
 */
async function category(this: APIThisType, { id }: categoryProps): Promise<UserCatalogCategoryType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'view-user-catalog' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// all categories in game
	let categories: UserCatalogCategoryType = (await ACCCache.get(constants.cacheKeys.sortedCategories))['all']['theme'];

	// list of catalog item ids the character has
	const catalogItemIds = (await db.query(`
		SELECT user_ac_item.item_id
		FROM user_ac_item
		WHERE user_ac_item.user_id = $1::int AND user_ac_item.is_inventory = $2
	`, id, true)).map((cci: any) => cci.item_id);

	if (catalogItemIds.length > 0)
	{
		for (let key in categories)
		{
			// all items in category that the user has
			categories[key].count = categories[key].groups
				.map((g: any) => g.items).flat()
				.filter((item: any) => catalogItemIds.includes(item.id)).length;
		}
	}

	return categories;
}

category.apiTypes = {
	id: {
		type: APITypes.userId,
		requried: true,
	},
};

type categoryProps = {
	id: number
};

export default category;
