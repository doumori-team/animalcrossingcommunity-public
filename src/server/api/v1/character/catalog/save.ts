import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { ACCCache } from '@cache';
import { APIThisType, ACGameItemType, SuccessType } from '@types';

async function save(this: APIThisType, { characterId, inventory, wishlist, museum, remove }: saveProps): Promise<SuccessType>
{
	const permissionGranted = await this.query('v1/permission', { permission: 'modify-towns' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// Check parameters
	const [character] = await db.query(`
		SELECT town.user_id, town.game_id
		FROM character
		JOIN town ON (town.id = character.town_id)
		WHERE character.id = $1::int
	`, characterId);

	if (character.user_id !== this.userId)
	{
		throw new UserError('permission');
	}

	const catalogItems: ACGameItemType[number]['all']['items'] = await ACCCache.get(`${constants.cacheKeys.sortedAcGameCategories}_${character.game_id}_all_items`);

	inventory = await Promise.all(inventory.map(async (id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	}));

	wishlist = await Promise.all(wishlist.map(async (id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	}));

	museum = await Promise.all(museum.map(async (id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	}));

	remove = await Promise.all(remove.map(async (id) =>
	{
		if (!catalogItems.find(item => item.id === id))
		{
			throw new UserError('bad-format');
		}

		return String(id).trim();
	}));

	// Perform queries
	if (wishlist.length > 0 || inventory.length > 0 || museum.length > 0 || remove.length > 0)
	{
		await Promise.all([
			updateItems(characterId, inventory, wishlist, museum),
			removeInventory(characterId, remove),
		]);
	}

	return {
		_success: `Your catalog has been updated.`,
	};
}

async function updateItems(characterId: number, inventory: any[], wishlist: any[], museum: any[]): Promise<void>
{
	if (inventory.length > 0 || wishlist.length > 0 || museum.length > 0)
	{
		await db.query(`
			DELETE FROM catalog_item
			WHERE character_id = $1::int AND catalog_item_id = ANY($2)
		`, characterId, inventory.concat(wishlist).concat(museum));
	}

	if (inventory.length > 0 && wishlist.length > 0 && museum.length > 0)
	{
		await Promise.all([
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4, $5
			`, characterId, inventory.filter(item => wishlist.includes(item) && museum.includes(item)), true, true, true),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4, $5
			`, characterId, inventory.filter(item => wishlist.includes(item) && !museum.includes(item)), true, true, false),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4, $5
			`, characterId, inventory.filter(item => !wishlist.includes(item) && !museum.includes(item)), true, false, false),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4, $5
			`, characterId, wishlist.filter(item => !inventory.includes(item) && museum.includes(item)), false, true, true),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4, $5
			`, characterId, wishlist.filter(item => !inventory.includes(item) && !museum.includes(item)), false, true, false),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4, $5
			`, characterId, museum.filter(item => inventory.includes(item) && !wishlist.includes(item)), true, false, true),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4, $5
			`, characterId, museum.filter(item => !inventory.includes(item) && !wishlist.includes(item)), false, false, true),
		]);
	}
	else if (inventory.length > 0 && wishlist.length > 0)
	{
		await Promise.all([
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, inventory.filter(item => wishlist.includes(item)), true, true),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, inventory.filter(item => !wishlist.includes(item)), true, false),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, is_wishlist)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, wishlist.filter(item => !inventory.includes(item)), false, true),
		]);
	}
	else if (wishlist.length > 0 && museum.length > 0)
	{
		await Promise.all([
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, in_museum, is_wishlist)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, wishlist.filter(item => museum.includes(item)), true, true),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, in_museum, is_wishlist)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, wishlist.filter(item => !museum.includes(item)), false, true),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, in_museum, is_wishlist)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, museum.filter(item => !wishlist.includes(item)), true, false),
		]);
	}
	else if (museum.length > 0 && inventory.length > 0)
	{
		await Promise.all([
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, inventory.filter(item => museum.includes(item)), true, true),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, inventory.filter(item => !museum.includes(item)), true, false),
			db.query(`
				INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory, in_museum)
				SELECT $1::int, unnest($2::text[]), $3, $4
			`, characterId, museum.filter(item => !inventory.includes(item)), false, true),
		]);
	}
	else if (inventory.length > 0)
	{
		await db.query(`
			INSERT INTO catalog_item (character_id, catalog_item_id, is_inventory)
			SELECT $1::int, unnest($2::text[]), $3
		`, characterId, inventory, true);
	}
	else if (wishlist.length > 0)
	{
		await db.query(`
			INSERT INTO catalog_item (character_id, catalog_item_id, is_wishlist)
			SELECT $1::int, unnest($2::text[]), $3
		`, characterId, wishlist, true);
	}
	else if (museum.length > 0)
	{
		await db.query(`
			INSERT INTO catalog_item (character_id, catalog_item_id, in_museum)
			SELECT $1::int, unnest($2::text[]), $3
		`, characterId, museum, true);
	}
}

async function removeInventory(characterId: number, remove: any[]): Promise<void>
{
	if (remove.length <= 0)
	{
		return;
	}

	await db.query(`
		DELETE FROM catalog_item
		WHERE character_id = $1::int AND catalog_item_id = ANY($2)
	`, characterId, remove);
}

save.apiTypes = {
	characterId: {
		type: APITypes.characterId,
		required: true,
	},
	inventory: {
		type: APITypes.array,
	},
	wishlist: {
		type: APITypes.array,
	},
	museum: {
		type: APITypes.array,
	},
	remove: {
		type: APITypes.array,
	},
};

type saveProps = {
	characterId: number
	inventory: any[]
	wishlist: any[]
	museum: any[]
	remove: any[]
};

export default save;
