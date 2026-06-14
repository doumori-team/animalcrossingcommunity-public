/* eslint-disable @typescript-eslint/no-explicit-any */
import { utils, constants } from '@utils';
import { ACGameItemType, GroupItemType } from '@types';
import acgcItems from './acgc/items.json';
import acwwItems from './acww/items.json';
import accfItems from './accf/items.json';
import acnlItems from './acnl/items.json';
import acpcItems from './acpc/items.json';
import acnhAccessories from '../acnh-sheet/accessories.json';
import acnhArtwork from '../acnh-sheet/artwork.json';
import acnhBags from '../acnh-sheet/bags.json';
import acnhBottoms from '../acnh-sheet/bottoms.json';
import acnhClothingOther from '../acnh-sheet/clothingOther.json';
import acnhDressUp from '../acnh-sheet/dressUp.json';
import acnhFencing from '../acnh-sheet/fencing.json';
import acnhFloors from '../acnh-sheet/floors.json';
import acnhFossils from '../acnh-sheet/fossils.json';
import acnhGyroids from '../acnh-sheet/gyroids.json';
import acnhHeadwear from '../acnh-sheet/headwear.json';
import acnhHousewares from '../acnh-sheet/housewares.json';
import acnhInteriorStructures from '../acnh-sheet/interiorStructures.json';
import acnhMiscellnaeous from '../acnh-sheet/miscellaneous.json';
import acnhMusic from '../acnh-sheet/music.json';
import acnhOther from '../acnh-sheet/other.json';
import acnhPhotos from '../acnh-sheet/photos.json';
import acnhPosters from '../acnh-sheet/posters.json';
import acnhRugs from '../acnh-sheet/rugs.json';
import acnhShoes from '../acnh-sheet/shoes.json';
import acnhSocks from '../acnh-sheet/socks.json';
import acnhTools from '../acnh-sheet/toolsgoods.json';
import acnhTops from '../acnh-sheet/tops.json';
import acnhUmbrellas from '../acnh-sheet/umbrellas.json';
import acnhWallMounted from '../acnh-sheet/wallMounted.json';
import acnhWallpaper from '../acnh-sheet/wallpaper.json';
import acgcCreatures from './acgc/creatures.json';
import acwwCreatures from './acww/creatures.json';
import accfCreatures from './accf/creatures.json';
import acnlCreatures from './acnl/creatures.json';
import acnhInsects from '../acnh-sheet/insects.json';
import acnhFish from '../acnh-sheet/fish.json';
import acnhSeaCreatures from '../acnh-sheet/seaCreatures.json';
import acnhRecipes from '../acnh-sheet/recipes.json';
import acnhCeilingDecor from '../acnh-sheet/ceilingDecor.json';
import acnhIgnore from './acnh-ignore.json';
import other from './other.json';
import acpcCreatures from './acpc/creatures.json';
import { getAcgcImageName } from './acgc/acgc-image-names.ts';
import { getAcnlImageName } from './acnl/acnl-image-names.ts';
import { getAcnhImageName } from './acnh-image-names.ts';
import { getAcwwImageName } from './acww/acww-image-names.ts';
import { getAccfImageName } from './accf/accf-image-names.ts';

const acgcCatalogItems = acgcItems.concat(acgcCreatures);
const acwwCatalogItems = acwwItems.concat(acwwCreatures);
const accfCatalogItems = (accfItems as any).concat(accfCreatures);
const acnlCatalogItems = acnlItems.concat(acnlCreatures);
const acpcCatalogItems = acpcItems.concat(acpcCreatures);
const acnhCatalogItems =
		(acnhAccessories as any)
		.concat(acnhArtwork)
		.concat(acnhBags)
		.concat(acnhBottoms)
		.concat(acnhClothingOther)
		.concat(acnhDressUp)
		.concat(acnhFencing)
		.concat(acnhFloors)
		.concat(acnhFossils)
		.concat(acnhGyroids)
		.concat(acnhHeadwear)
		.concat(acnhHousewares)
		.concat(acnhInteriorStructures)
		.concat(acnhMiscellnaeous)
		.concat(acnhMusic)
		.concat(acnhOther)
		.concat(acnhPhotos)
		.concat(acnhPosters)
		.concat(acnhRugs)
		.concat(acnhShoes)
		.concat(acnhSocks)
		.concat(acnhTools)
		.concat(acnhTops)
		.concat(acnhUmbrellas)
		.concat(acnhWallMounted)
		.concat(acnhWallpaper)
		.concat(acnhInsects)
		.concat(acnhFish)
		.concat(acnhSeaCreatures)
		.concat(acnhRecipes)
		.concat(acnhCeilingDecor)
		// remove any items that shouldn't be in the catalog at all:
		// - Item is Music and has no album image (Hazure01, etc.)
		// - Item is 'unknown fossil', 'gyroid fragment' or recipes / apps / permissions
		// - Item is in list of ignore items
		.filter((item: any) =>
		{
			return (item.sourceSheet === 'Music' && item.catalog !== 'Not in catalog' || item.sourceSheet !== 'Music') &&
				(!['FossilUnknown', 'HaniwaPiece', 'Unnecessary'].includes(item.tag) &&
				!acnhIgnore.some(x => x.uniqueEntryId === item.uniqueEntryId));
		});

// Grabs the data from the files and sorts it in a way that's easier for the front-end

export const sortedAcGameCategories = {
	[constants.gameIds.ACGC]: getCategoriesForSorting(constants.gameIds.ACGC, acgcCatalogItems),
	[constants.gameIds.ACWW]: getCategoriesForSorting(constants.gameIds.ACWW, acwwCatalogItems),
	[constants.gameIds.ACCF]: getCategoriesForSorting(constants.gameIds.ACCF, accfCatalogItems),
	[constants.gameIds.ACNL]: getCategoriesForSorting(constants.gameIds.ACNL, acnlCatalogItems),
	[constants.gameIds.ACNH]: getCategoriesForSorting(constants.gameIds.ACNH, acnhCatalogItems),
	[constants.gameIds.ACPC]: getCategoriesForSorting(constants.gameIds.ACPC, acpcCatalogItems),
};

export const sortedCategories = getOtherCategoriesForSorting();

type OtherCatalogItem = {
	sourceSheet: string
	name: string
	uniqueEntryId: string
	series: string
	// AC:NH only
	pattern?: string | null
	patternCustomize?: 'Yes' | 'No'
	variantId?: string
	category?: string
	// AC:PC only
	variation?: string
};

type CatalogItem = {
	sourceSheet: string
	name: string
	uniqueEntryId: string
	series?: string
	catalogPosition?: number
	tradeable?: boolean
	// AC:NH only
	hhaSet?: string
	genuine?: 'Yes' | 'No'
	hhaSeries?: string
	pattern?: string | null
	patternCustomize?: 'Yes' | 'No'
	variantId?: string
	category?: string
	// AC:NH && AC:PC only
	variation?: string | number
};

function getOtherCategoriesForSorting(): ACGameItemType[number]
{
	const catalogItems: OtherCatalogItem[] = other;
	let sortedCategories: any = {};
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
function getCategoriesForSorting(id: number, catalogItems: CatalogItem[]): ACGameItemType[number]
{
	let sortedCategories: any = {};
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
function getAllItemsStructure(items: GroupItemType['groups'][0]['items']): GroupItemType[]
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
function catalogAlphabeticalFilterByCategory(catalogAlphabeticalCatalogItems: GroupItemType['groups'][0]['items'], categoryName: string): GroupItemType['groups'][0]['items']
{
	return catalogAlphabeticalCatalogItems.filter(item => utils.convertForUrl(item.categoryName) === categoryName);
}

/*
 * Sorts the given items alphabetically.
 */
function alphabeticalSort(filteredItems: GroupItemType['groups'][0]['items']): GroupItemType['groups'][0]['items']
{
	return filteredItems.sort((a, b) => a.name.localeCompare(b.name));
}

/*
 * Goes through game sheet of items and organizes it into categories.
 */
function getThemeSort(catalogItems: OtherCatalogItem[] | CatalogItem[], gameId: number): GroupItemType[]
{
	let acgameCategories: GroupItemType[] = [];

	for (let key in catalogItems)
	{
		let item = catalogItems[key];

		// figure out group name
		let groupName = item.sourceSheet;

		if ('series' in item && item.series !== undefined && item.series !== null)
		{
			groupName = item.series;
		}
		else if ('hhaSeries' in item && item.hhaSeries !== undefined && item.hhaSeries !== null)
		{
			groupName = item.hhaSeries;
		}
		else if ('hhaSet' in item && item.hhaSet !== undefined && item.hhaSet !== null)
		{
			groupName = item.hhaSet;
		}

		let catalogPosition = 'catalogPosition' in item && item.catalogPosition !== undefined ? item.catalogPosition : 0;
		let museum = Object.prototype.hasOwnProperty.call(item, 'description') ? true : false;
		let genuine = 'genuine' in item && item.genuine !== undefined ? item.genuine === 'Yes' : true;

		let imageName: string | null = null;

		if (gameId === constants.gameIds.ACGC)
		{
			imageName = getAcgcImageName(item.name, groupName, item.sourceSheet);
		}
		else if (gameId === constants.gameIds.ACWW)
		{
			imageName = getAcwwImageName(item.name, item.sourceSheet);
		}
		else if (gameId === constants.gameIds.ACCF)
		{
			imageName = getAccfImageName(item.name, item.sourceSheet);
		}
		else if (gameId === constants.gameIds.ACNL)
		{
			imageName = getAcnlImageName(item.name, groupName, item.sourceSheet);
		}
		else if (gameId === constants.gameIds.ACNH)
		{
			let pattern = item.pattern !== null && item.pattern !== undefined ? item.pattern : item.patternCustomize === 'Yes' ? 'none' : null;
			let variation = item.variation !== null && item.variation !== undefined ? String(item.variation) : pattern === null && item.variantId !== null && item.variantId !== undefined ? 'none' : null;
			let genuineImage = 'genuine' in item && item.genuine !== undefined ? item.genuine === 'Yes' : null;
			let category = item.category !== null && item.category !== undefined ? item.category : null;

			imageName = getAcnhImageName(item.name, item.sourceSheet, genuineImage, variation, pattern, category);
		}

		acgameCategories = itemCalculations(
			acgameCategories,
			item.sourceSheet,
			groupName,
			getItemName(gameId, item.name, item),
			acgameCategories.find(category => category.categoryName === item.sourceSheet),
			item,
			catalogPosition,
			museum,
			genuine,
			getTradeableStatus(item, gameId),
			imageName,
		);
	}

	// sorted by name because v1/town && v1/character/catalog/category need it
	return acgameCategories.sort((a, b) => a.categoryName.localeCompare(b.categoryName));
}

/*
 * Whether an item is tradeable.
 */
function getTradeableStatus(item: OtherCatalogItem | CatalogItem, gameId: number): boolean
{
	if ('tradeable' in item && item.tradeable !== undefined)
	{
		return item.tradeable;
	}

	// ACNH source sheets don't have tradeable column, so we calculate it
	if (gameId === constants.gameIds.ACNH && 'sell' in item && 'unlocked' in item)
	{
		// not tradeable if:
		// - Fish, Sea Creature or Insect
		// - Unsellable Recipe
		// - Item isn't available in the game yet
		if (['Fish', 'Sea Creatures', 'Insects'].includes(item.sourceSheet) ||
			item.sourceSheet === 'Recipes' && item.sell === null ||
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
function getCatalogAlphabeticalSort(catalogItems: OtherCatalogItem[] | CatalogItem[], gameId: number): GroupItemType['groups'][0]['items']
{
	let items: GroupItemType['groups'][0]['items'] = [];

	for (let key in catalogItems)
	{
		let item = catalogItems[key];

		let catalogPosition = 'catalogPosition' in item && item.catalogPosition !== undefined ? item.catalogPosition : 0;
		let museum = Object.prototype.hasOwnProperty.call(item, 'description') ? true : false;
		let genuine = 'genuine' in item && item.genuine !== undefined ? item.genuine === 'Yes' : true;

		let imageName: string | null = null;

		if (gameId === constants.gameIds.ACGC)
		{
			imageName = getAcgcImageName(item.name, item.series || item.sourceSheet, item.sourceSheet);
		}
		else if (gameId === constants.gameIds.ACWW)
		{
			imageName = getAcwwImageName(item.name, item.sourceSheet);
		}
		else if (gameId === constants.gameIds.ACCF)
		{
			imageName = getAccfImageName(item.name, item.sourceSheet);
		}
		else if (gameId === constants.gameIds.ACNL)
		{
			imageName = getAcnlImageName(item.name, item.series || item.sourceSheet, item.sourceSheet);
		}
		else if (gameId === constants.gameIds.ACNH)
		{
			let pattern = item.pattern !== null && item.pattern !== undefined ? item.pattern : item.patternCustomize === 'Yes' ? 'none' : null;
			let variation = item.variation !== null && item.variation !== undefined ? String(item.variation) : pattern === null && item.variantId !== null && item.variantId !== undefined ? 'none' : null;
			let genuineImage = 'genuine' in item && item.genuine !== undefined ? item.genuine === 'Yes' : null;
			let category = item.category !== null && item.category !== undefined ? item.category : null;

			imageName = getAcnhImageName(item.name, item.sourceSheet, genuineImage, variation, pattern, category);
		}

		if (!items.find(i => i.id === item.uniqueEntryId))
		{
			items.push({
				id: item.uniqueEntryId,
				name: getItemName(gameId, item.name, item),
				position: catalogPosition,
				categoryName: item.sourceSheet,
				museum: museum,
				genuine: genuine,
				tradeable: getTradeableStatus(item, gameId),
				imageName,
			});
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
function itemCalculations(acgameCategories: GroupItemType[], categoryName: string, groupName: string, itemName: string, category: GroupItemType | undefined, item: any, catalogPosition: number, museum: boolean, genuine: boolean, tradeable: boolean, imageName: string | null): GroupItemType[]
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
					imageName: imageName,
				}],
			}],
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
					imageName: imageName,
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
					imageName: imageName,
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
 * 	gameId - game id - number
 * 	itemName - default item name - string
 * 	item - item row from json file - object
 */
function getItemName(gameId: number, itemName: string, item: OtherCatalogItem | CatalogItem)
{
	// for artwork
	if ('genuine' in item)
	{
		if (item.genuine === 'Yes')
		{
			itemName += ' - Real';
		}
		else
		{
			itemName += ' - Fake';
		}
	}

	// items have either variations and / or patterns as additional descriptors

	if (Object.prototype.hasOwnProperty.call(item, 'variation') && item.variation !== null)
	{
		itemName += ' - ' + item.variation;
	}

	if (Object.prototype.hasOwnProperty.call(item, 'pattern') && item.pattern !== null)
	{
		itemName += ' - ' + item.pattern;
	}

	if (item.sourceSheet === 'Recipes')
	{
		itemName += ' (Recipe)';
	}

	if (gameId === constants.gameIds.ACPC)
	{
		if (Object.prototype.hasOwnProperty.call(item, 'variation'))
		{
			itemName += ' - ' + item.variation;
		}
	}

	return itemName;
}
