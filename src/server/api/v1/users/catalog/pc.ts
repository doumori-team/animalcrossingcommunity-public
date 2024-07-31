import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { APIThisType, CatalogItemsType } from '@types';

/*
 * Fetches information about a user's catalog (PC).
 */
async function pc(this: APIThisType, {id}: pcProps) : Promise<CatalogItemsType[]>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'view-user-catalog'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const catalog = await db.query(`
		SELECT
			pc_catalog_item.catalog_item_id AS id,
			pc_catalog_item.is_inventory,
			pc_catalog_item.is_wishlist
		FROM pc_catalog_item
		WHERE pc_catalog_item.user_id = $1::int
	`, id);

	return catalog.map((item:any) => {
		return {
			id: item.id,
			isInventory: item.is_inventory,
			isWishlist: item.is_wishlist,
		};
	});
}

pc.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
}

type pcProps = {
	id: number
}

export default pc;