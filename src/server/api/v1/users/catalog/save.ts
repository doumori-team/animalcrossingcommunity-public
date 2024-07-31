import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, ACGameItemType } from '@types';

async function save(this: APIThisType, {inventory, wishlist, remove}: saveProps) : Promise<void>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-user-catalog'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	// all items
	const catalogItems:ACGameItemType[number]['all']['items'] = (await ACCCache.get(constants.cacheKeys.sortedCategories))['all']['items'];

	// Check inventory
	inventory = await Promise.all(inventory.map(async (id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	}));

	// Check wishlist
	wishlist = await Promise.all(wishlist.map(async (id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	}));

	// Check remove
	remove = await Promise.all(remove.map(async (id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	}));

	// Run sql
	if (wishlist.length > 0 || inventory.length > 0 || remove.length > 0)
	{
		// Other area validations
		await Promise.all([
			updateItems.bind(this)(inventory, wishlist),
			removeInventory.bind(this)(remove),
		]);
	}
}

async function updateItems(this: APIThisType, inventory:any[], wishlist:any[]) : Promise<void>
{
	if (inventory.length > 0 || wishlist.length > 0)
	{
		await db.query(`
			DELETE FROM user_ac_item
			WHERE user_id = $1::int AND item_id = ANY($2)
		`, this.userId, inventory.concat(wishlist));
	}

	if (inventory.length > 0 && wishlist.length > 0)
	{
		await Promise.all([
			db.query(`
				INSERT INTO user_ac_item (user_id, item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::int[]), $3, $4
			`, this.userId, inventory.filter(item => wishlist.includes(item)), true, true),
			db.query(`
				INSERT INTO user_ac_item (user_id, item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::int[]), $3, $4
			`, this.userId, inventory.filter(item => !wishlist.includes(item)), true, false),
			db.query(`
				INSERT INTO user_ac_item (user_id, item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::int[]), $3, $4
			`, this.userId, wishlist.filter(item => !inventory.includes(item)), false, true)
		]);
	}
	else if (inventory.length > 0)
	{
		await db.query(`
			INSERT INTO user_ac_item (user_id, item_id, is_inventory)
			SELECT $1::int, unnest($2::int[]), $3
		`, this.userId, inventory, true);
	}
	else if (wishlist.length > 0)
	{
		await db.query(`
			INSERT INTO user_ac_item (user_id, item_id, is_wishlist)
			SELECT $1::int, unnest($2::int[]), $3
		`, this.userId, wishlist, true);
	}
}

async function removeInventory(this: APIThisType, remove:any[]) : Promise<void>
{
	if (remove.length <= 0)
	{
		return;
	}

	await db.query(`
		DELETE FROM user_ac_item
		WHERE user_id = $1::int AND item_id = ANY($2)
	`, this.userId, remove);
}

save.apiTypes = {
	inventory: {
		type: APITypes.array,
	},
	wishlist: {
		type: APITypes.array,
	},
	remove: {
		type: APITypes.array,
	},
}

type saveProps = {
	inventory: any[]
	wishlist: any[]
	remove: any[]
}

export default save;