import * as db from '@db';
import * as APITypes from '@apiTypes';
import { APIThisType, CatalogItemsType } from '@types';

async function catalog(this: APIThisType, { id }: catalogProps): Promise<CatalogItemsType[]>
{
	// Run queries
	const catalog: { id: string, is_inventory: boolean, is_wishlist: boolean }[] = await db.query(`
		SELECT
			user_ac_item.item_id AS id,
			user_ac_item.is_inventory,
			user_ac_item.is_wishlist
		FROM user_ac_item
		WHERE user_ac_item.user_id = $1::int
	`, id);

	return catalog.map(item =>
	{
		return {
			id: item.id,
			isInventory: item.is_inventory,
			isWishlist: item.is_wishlist,
		};
	});
}

catalog.permissions = [
	'view-user-catalog',
	'use-trading-post',
];

catalog.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
};

type catalogProps = {
	id: number
};

export default catalog;
