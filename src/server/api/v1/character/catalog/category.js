import * as db from '@db';
import { sortedAcGameCategories as sortedCategories } from '@/catalog/data.js';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

/*
 * Gets how many items a character has collected per category.
 */
async function category({characterId})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'view-towns'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [character] = await db.query(`
		SELECT character.id, town.game_id
		FROM character
		JOIN town ON (town.id = character.town_id)
		WHERE character.id = $1::int
	`, characterId);

	// all categories in game
	let acgameCategories = sortedCategories[character.game_id]['all']['theme'];

	// list of catalog item ids the character has
	const characterCatalogItemIds = (await db.query(`
		SELECT
			catalog_item.catalog_item_id
		FROM catalog_item
		WHERE catalog_item.character_id = $1::int AND catalog_item.is_inventory = $2
	`, characterId, true)).map(cci => cci.catalog_item_id);

	for (let key in acgameCategories)
	{
		if (characterCatalogItemIds.length > 0)
		{
			// all items in category that the user has
			acgameCategories[key].count = (acgameCategories[key].groups
				.map(g => g.items).flat()
				.filter(item => characterCatalogItemIds.includes(item.id))).length;
		}
		else
		{
			acgameCategories[key].count = 0;
		}
	}

	return acgameCategories;
}

category.apiTypes = {
	characterId: {
		type: APITypes.characterId,
	},
}

export default category;