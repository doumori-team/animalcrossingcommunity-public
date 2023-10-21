import * as db from '@db';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function catalog({id})
{
	const [viewUserCatalog, useTradingPostPerm] = await Promise.all([
		this.query('v1/permission', {permission: 'view-user-catalog'}),
		this.query('v1/permission', {permission: 'use-trading-post'}),
	]);

	if (!(viewUserCatalog || useTradingPostPerm))
	{
		throw new UserError('permission');
	}

	// Run queries
	const catalog = await db.query(`
		SELECT
			user_ac_item.item_id AS id,
			user_ac_item.is_inventory,
			user_ac_item.is_wishlist
		FROM user_ac_item
		WHERE user_ac_item.user_id = $1::int
	`, id);

	return catalog.map(item => {
		return {
			id: item.id,
			isInventory: item.is_inventory,
			isWishlist: item.is_wishlist,
		};
	});
}

catalog.apiTypes = {
	id: {
		type: APITypes.userId,
	},
}

export default catalog;