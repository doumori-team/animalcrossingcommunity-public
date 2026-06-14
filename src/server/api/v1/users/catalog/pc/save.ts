import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, ACGameItemType, SuccessType } from '@types';

/*
 * Saves information about a user's catalog (Pocket Camp).
 */
async function save(this: APIThisType, { inventory, wishlist, remove }: saveProps): Promise<SuccessType>
{
	// Check parameters
	// all items
	const catalogItems: ACGameItemType[number]['all']['items'] = await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${constants.gameIds.ACPC}_all_items`);

	// Check inventory
	inventory = inventory.map(id =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	});

	// Check wishlist
	wishlist = wishlist.map(id =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	});

	// Check remove
	remove = remove.map(id =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	});

	// Run sql
	if (wishlist.length > 0 || inventory.length > 0 || remove.length > 0)
	{
		await Promise.all([
			updateItems.bind(this)(inventory, wishlist),
			removeInventory.bind(this)(remove),
		]);
	}

	this.query('v1/users/badge/check', { badgeId: constants.badges.pcitems });

	return {
		_success: `Your catalog has been updated.`,
	};
}

async function updateItems(this: APIThisType, inventory: string[], wishlist: string[]): Promise<void>
{
	if (inventory.length > 0 || wishlist.length > 0)
	{
		await db.query(`
			DELETE FROM pc_catalog_item
			WHERE user_id = $1::int AND catalog_item_id = ANY($2)
		`, this.userId, inventory.concat(wishlist));
	}

	if (inventory.length > 0 && wishlist.length > 0)
	{
		await Promise.all([
			db.query(`
				INSERT INTO pc_catalog_item (user_id, catalog_item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::int[]), $3, $4
			`, this.userId, inventory.filter(item => wishlist.includes(item)), true, true),
			db.query(`
				INSERT INTO pc_catalog_item (user_id, catalog_item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::int[]), $3, $4
			`, this.userId, inventory.filter(item => !wishlist.includes(item)), true, false),
			db.query(`
				INSERT INTO pc_catalog_item (user_id, catalog_item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::int[]), $3, $4
			`, this.userId, wishlist.filter(item => !inventory.includes(item)), false, true),
		]);
	}
	else if (inventory.length > 0)
	{
		await db.query(`
			INSERT INTO pc_catalog_item (user_id, catalog_item_id, is_inventory)
			SELECT $1::int, unnest($2::int[]), $3
		`, this.userId, inventory, true);
	}
	else if (wishlist.length > 0)
	{
		await db.query(`
			INSERT INTO pc_catalog_item (user_id, catalog_item_id, is_wishlist)
			SELECT $1::int, unnest($2::int[]), $3
		`, this.userId, wishlist, true);
	}
}

async function removeInventory(this: APIThisType, remove: string[]): Promise<void>
{
	if (remove.length <= 0)
	{
		return;
	}

	await db.query(`
		DELETE FROM pc_catalog_item
		WHERE user_id = $1::int AND catalog_item_id = ANY($2)
	`, this.userId, remove);
}

save.permissions = [
	'modify-user-catalog',
	'userId',
];

save.apiTypes = {
	inventory: {
		type: APITypes.array,
	},
	wishlist: {
		type: APITypes.array,
	},
	remove: {
		type: APITypes.array,
		userInput: true,
	},
};

type saveProps = {
	inventory: string[]
	wishlist: string[]
	remove: string[]
};

export default save;
