import { utils, constants } from '@utils';

import acgcItems from './acgc/items.json' assert { type: 'json'};
import acwwItems from './acww/items.json' assert { type: 'json'};
import accfItems from './accf/items.json' assert { type: 'json'};
import acnlItems from './acnl/items.json' assert { type: 'json'};
import acpcItems from './acpc/items.json' assert { type: 'json'};
import acnhItems from '../acnh-sheet/items.json' assert { type: 'json'};
import acgcCreatures from './acgc/creatures.json' assert { type: 'json'};
import acwwCreatures from './acww/creatures.json' assert { type: 'json'};
import accfCreatures from './accf/creatures.json' assert { type: 'json'};
import acnlCreatures from './acnl/creatures.json' assert { type: 'json'};
import acnhCreatures from '../acnh-sheet/creatures.json' assert { type: 'json'};
import acnhRecipes from '../acnh-sheet/recipes.json' assert { type: 'json'};
import acnhCeilingDecor from '../acnh-sheet/ceilingDecor.json' assert { type: 'json'};
import acnhIgnore from './acnh-ignore.json' assert { type: 'json'};
import other from './other.json' assert { type: 'json'};
import acpcCreatures from './acpc/creatures.json' assert { type: 'json'};

const acgcCatalogItems = acgcItems.concat(acgcCreatures);
const acwwCatalogItems = acwwItems.concat(acwwCreatures);
const accfCatalogItems = accfItems.concat(accfCreatures);
const acnlCatalogItems = acnlItems.concat(acnlCreatures);
const acpcCatalogItems = acpcItems.concat(acpcCreatures);
const acnhCatalogItems =
		acnhItems
		.concat(acnhCreatures)
		.concat(acnhRecipes)
		.concat(acnhCeilingDecor)
		// remove any items that shouldn't be in the catalog at all:
		// - Item is Music and has no album image (Hazure01, etc.)
		// - Item is 'unknown fossil', 'gyroid fragment' or recipes / apps / permissions
		// - Item is Message Card
		// - Item is in list of ignore items
		.filter(item => {
			return ((item.sourceSheet === 'Music' && item.albumImage !== null) || item.sourceSheet !== 'Music') &&
				(!['FossilUnknown', 'HaniwaPiece', 'Unnecessary'].includes(item.tag) &&
				(item.sourceSheet !== 'Message Cards') &&
				(!acnhIgnore.some(x => x.uniqueEntryId === item.uniqueEntryId)));
		});

// Grabs the data from the files and sorts it in a way that's easier for the front-end

export const sortedAcGameCategories = {
	[constants.gameIds.ACGC]: getCategoriesForSorting(constants.gameIds.ACGC, acgcCatalogItems),
	[constants.gameIds.ACWW]: getCategoriesForSorting(constants.gameIds.ACWW, acwwCatalogItems),
	[constants.gameIds.ACCF]: getCategoriesForSorting(constants.gameIds.ACCF, accfCatalogItems),
	[constants.gameIds.ACNL]: getCategoriesForSorting(constants.gameIds.ACNL, acnlCatalogItems),
	[constants.gameIds.ACNH]: getCategoriesForSorting(constants.gameIds.ACNH, acnhCatalogItems),
	[constants.gameIds.ACPC]: getCategoriesForSorting(constants.gameIds.ACPC, acpcCatalogItems)
};

export const sortedCategories = getOtherCategoriesForSorting();

function getOtherCategoriesForSorting()
{
	const catalogItems = other;
	let sortedCategories = {};
	const themedCatalogItems = getThemeSort(catalogItems, 0);
	const catalogAlphabeticalCatalogItems = getCatalogAlphabeticalSort(catalogItems, 0);

	for (let key in themedCatalogItems)
	{
		let categoryName = utils.convertForUrl(themedCatalogItems[key].categoryName);

		sortedCategories[categoryName] = {
			'theme': themedCatalogItems.filter(category => utils.convertForUrl(category.categoryName) === categoryName),
		};

		sortedCategories[categoryName]['alphabetical'] = getAllItemsStructure(alphabeticalSort(catalogAlphabeticalFilterByCategory(catalogAlphabeticalCatalogItems, categoryName)));
	}

	// add additional 'category' for looking at all items
	sortedCategories['all'] = {
		'theme': themedCatalogItems,
		'alphabetical': getAllItemsStructure(alphabeticalSort(catalogAlphabeticalCatalogItems)),
	};

	sortedCategories['all']['items'] = sortedCategories['all']['alphabetical'][0].groups[0].items;

	return sortedCategories;
}

/*
 * For each game, gets the categories w/items sorted in various ways.
 */
function getCategoriesForSorting(id, catalogItems)
{
	let sortedCategories = {};
	const themedCatalogItems = getThemeSort(catalogItems, id);
	const catalogAlphabeticalCatalogItems = getCatalogAlphabeticalSort(catalogItems, id);

	for (let key in themedCatalogItems)
	{
		let categoryName = utils.convertForUrl(themedCatalogItems[key].categoryName);

		sortedCategories[categoryName] = {
			'theme': themedCatalogItems.filter(category => utils.convertForUrl(category.categoryName) === categoryName),
		};

		// AC:NH, to sort by catalog is to be sorted alphabetically
		if ([constants.gameIds.ACNH, constants.gameIds.ACPC].includes(id))
		{
			sortedCategories[categoryName]['alphabetical'] = getAllItemsStructure(alphabeticalSort(catalogAlphabeticalFilterByCategory(catalogAlphabeticalCatalogItems, categoryName)));
			sortedCategories[categoryName]['catalog'] = sortedCategories[categoryName]['alphabetical'];
		}
		else
		{
			const filteredCatalogAlphabeticalItems = catalogAlphabeticalFilterByCategory(catalogAlphabeticalCatalogItems, categoryName);

			sortedCategories[categoryName]['alphabetical'] = getAllItemsStructure(alphabeticalSort(filteredCatalogAlphabeticalItems));
			sortedCategories[categoryName]['catalog'] = getAllItemsStructure(filteredCatalogAlphabeticalItems.sort((a, b) => a.position - b.position));
		}
	}

	// add additional 'category' for looking at all items
	sortedCategories['all'] = {
		'theme': themedCatalogItems,
		'alphabetical': getAllItemsStructure(alphabeticalSort(catalogAlphabeticalCatalogItems)),
	};

	// AC:NH, to sort by catalog is to be sorted alphabetically
	if ([constants.gameIds.ACNH, constants.gameIds.ACPC].includes(id))
	{
		sortedCategories['all']['catalog'] = sortedCategories['all']['alphabetical'];
	}
	else
	{
		sortedCategories['all']['catalog'] = getAllItemsStructure(catalogAlphabeticalCatalogItems.sort((a, b) => a.position - b.position));
	}

	sortedCategories['all']['items'] = sortedCategories['all']['alphabetical'][0].groups[0].items;

	return sortedCategories;
}

/*
 * Returns the structure used when sorting by catalog or alphabetically.
 */
function getAllItemsStructure(items)
{
	return [{
		categoryName: '', // doesn't matter
		total: 0, // doesn't matter
		count: 0, // doesn't matter
		groups: [{
			groupName: '', // doesn't matter
			total: 0, // doesn't matter
			items: items,
		}],
	}];
}

/*
 * Filters the given items by the given category.
 */
function catalogAlphabeticalFilterByCategory(catalogAlphabeticalCatalogItems, categoryName)
{
	return catalogAlphabeticalCatalogItems.filter(item => utils.convertForUrl(item.categoryName) === categoryName);
}

/*
 * Sorts the given items alphabetically.
 */
function alphabeticalSort(filteredItems)
{
	return filteredItems.sort((a, b) => a.name.localeCompare(b.name));
}

/*
 * Goes through game sheet of items and organizes it into categories.
 */
function getThemeSort(catalogItems, gameId)
{
	let acgameCategories = [];

	for (let key in catalogItems)
	{
		let item = catalogItems[key];

		// figure out group name
		let groupName = item.sourceSheet;

		if (item.hasOwnProperty('series') && item.series !== null)
		{
			groupName = item.series;
		}
		else if (item.hasOwnProperty('set') && item.set !== null)
		{
			groupName = item.set;
		}

		let catalogPosition = item.hasOwnProperty('catalogPosition') ? item.catalogPosition : 0;
		let museum = item.hasOwnProperty('description') ? true : false;
		let genuine = item.hasOwnProperty('genuine') ? item.genuine : true;

		if (!item.hasOwnProperty('uniqueEntryId') && item.hasOwnProperty('variations'))
		{
			let totalVariants = item.variations.length;

			for (let variantKey in item.variations)
			{
				let variant = item.variations[variantKey];

				acgameCategories = itemCalculations(
					acgameCategories,
					item.sourceSheet,
					groupName,
					getItemName(item.name, item, variant, totalVariants),
					acgameCategories.find(category => category.categoryName === item.sourceSheet),
					variant,
					catalogPosition,
					museum,
					genuine,
					getTradeableStatus(item, gameId),
				);
			}
		}
		else
		{
			acgameCategories = itemCalculations(
				acgameCategories,
				item.sourceSheet,
				groupName,
				getItemName(item.name, item),
				acgameCategories.find(category => category.categoryName === item.sourceSheet),
				item,
				catalogPosition,
				museum,
				genuine,
				getTradeableStatus(item, gameId),
			);
		}
	}

	// sorted by name because v1/town && v1/character/catalog/category need it
	return acgameCategories.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

/*
 * Whether an item is tradeable.
 */
function getTradeableStatus(item, gameId)
{
	if (item.hasOwnProperty('tradeable'))
	{
		return item.tradeable;
	}

	// ACNH source sheets don't have tradeable column, so we calculate it
	if (gameId === constants.gameIds.ACNH)
	{
		// not tradeable if:
		// - Fish, Sea Creature or Insect
		// - Unsellable Recipe
		// - Item isn't available in the game yet
		if (['Fish', 'Sea Creatures', 'Insects'].includes(item.sourceSheet) ||
			(item.sourceSheet === 'Recipes' && item.sell === null) ||
			item.unlocked === false
		)
		{
			return false;
		}
	}

	if (gameId === constants.gameIds.ACPC)
	{
		return false;
	}

	return true;
}

/*
 * Goes through game sheet of items and reorganizes it into list of items with info we need.
 */
function getCatalogAlphabeticalSort(catalogItems, gameId)
{
	let items = [];

	for (let key in catalogItems)
	{
		let item = catalogItems[key];

		let catalogPosition = item.hasOwnProperty('catalogPosition') ? item.catalogPosition : 0;
		let museum = item.hasOwnProperty('description') ? true : false;
		let genuine = item.hasOwnProperty('genuine') ? item.genuine : true;

		if (!item.hasOwnProperty('uniqueEntryId') && item.hasOwnProperty('variations'))
		{
			let totalVariants = item.variations.length;

			for (let variantKey in item.variations)
			{
				let variant = item.variations[variantKey];

				if (!items.find(item => item.id === variant.uniqueEntryId))
				{
					items.push({
						id: variant.uniqueEntryId,
						name: getItemName(item.name, item, variant, totalVariants),
						position: catalogPosition,
						categoryName: item.sourceSheet,
						museum: museum,
						genuine: genuine,
						tradeable: getTradeableStatus(item, gameId),
					});
				}
			}
		}
		else
		{
			if (!items.find(item => item.id === item.uniqueEntryId))
			{
				items.push({
					id: item.uniqueEntryId,
					name: getItemName(item.name, item),
					position: catalogPosition,
					categoryName: item.sourceSheet,
					museum: museum,
					genuine: genuine,
					tradeable: getTradeableStatus(item, gameId),
				});
			}
		}
	}

	return items;
}

/*
 * Figure out how to add to sorted catalog items list.
 *
 * parameters:
 * 	acgameCategories - sort list of catalog items - array of objects
 * 	categoryName - item's category name - string
 * 	groupName - item's group name - string
 * 	itemName - item's name - string
 * 	category - found category row in acgameCategories - object
 * 	item - item row from json file (item or variant) - object
 * 	catalogPosition - item's catalog position - number
 * 	museum - if item is found in museum - boolean
 * 	genuine - false if not genuine item (used for artwork) - boolean
 */
function itemCalculations(acgameCategories, categoryName, groupName, itemName, category, item, catalogPosition, museum, genuine, tradeable)
{
	if (!category)
	{
		acgameCategories.push({
			categoryName: categoryName,
			total: 1,
			count: 0,
			groups: [{
				groupName: groupName,
				total: 1,
				items: [{
					id: item.uniqueEntryId,
					name: itemName,
					position: catalogPosition,
					categoryName: categoryName,
					museum: museum,
					genuine: genuine,
					tradeable: tradeable,
				}],
			}]
		});
	}
	else
	{
		let group = category.groups.find(group => group.groupName === groupName);

		if (!group)
		{
			category.groups.push({
				groupName: groupName,
				total: 1,
				items: [{
					id: item.uniqueEntryId,
					name: itemName,
					position: catalogPosition,
					categoryName: categoryName,
					museum: museum,
					genuine: genuine,
					tradeable: tradeable,
				}],
			});

			category.total++;
		}
		else
		{
			let groupItem = group.items.find(gitem => gitem.id === item.uniqueEntryId);

			if (!groupItem)
			{
				category.total++;
				group.total++;

				group.items.push({
					id: item.uniqueEntryId,
					name: itemName,
					position: catalogPosition,
					categoryName: categoryName,
					museum: museum,
					genuine: genuine,
					tradeable: tradeable,
				});
			}
		}
	}

	return acgameCategories;
}

/*
 * Figure out the item name for display.
 *
 * parameters:
 * 	itemName - default item name - string
 * 	item - item row from json file - object
 * 	variant - variant row from json file - object (optional)
 * 	totalVariants - total number of variants - number
 */
function getItemName(itemName, item, variant = null, totalVariants = 0)
{
	// for artwork
	if (item.hasOwnProperty('genuine'))
	{
		if (item.genuine)
		{
			itemName += ' - Real';
		}
		else
		{
			itemName += ' - Fake';
		}
	}

	if (totalVariants > 1)
	{
		// items have either variations and / or patterns as additional descriptors

		if (variant.hasOwnProperty('variation') && variant.variation !== null)
		{
			itemName += ' - ' + variant.variation;
		}

		if (variant.hasOwnProperty('pattern') && variant.pattern !== null)
		{
			itemName += ' - ' + variant.pattern;
		}
	}

	if (item.sourceSheet === 'Recipes')
	{
		itemName += ' (Recipe)';
	}

	return itemName;
}