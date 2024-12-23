import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { APIThisType, CatalogItemsType } from '@types';

async function catalog(this: APIThisType, { id }: catalogProps): Promise<CatalogItemsType[]>
{
	const [viewTowns, useTradingPost] = await Promise.all([
		this.query('v1/permission', { permission: 'view-towns' }),
		this.query('v1/permission', { permission: 'use-trading-post' }),
	]);

	if (!(viewTowns || useTradingPost))
	{
		throw new UserError('permission');
	}

	const catalog = await db.query(`
		SELECT
			catalog_item.catalog_item_id AS id,
			catalog_item.is_inventory,
			catalog_item.is_wishlist,
			catalog_item.in_museum
		FROM catalog_item
		WHERE catalog_item.character_id = $1::int
	`, id);

	return catalog.map((item: any) =>
	{
		return {
			id: item.id,
			isInventory: item.is_inventory,
			isWishlist: item.is_wishlist,
			inMuseum: item.in_museum,
		};
	});
}

catalog.apiTypes = {
	id: {
		type: APITypes.characterId,
		required: true,
	},
};

type catalogProps = {
	id: number
};

export default catalog;
