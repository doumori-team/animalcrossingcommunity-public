import { constants, dateUtils } from '@utils';

import acnlPwps from './acnl/pwps.json' assert { type: "json" };
import { 
	indexedAvatarCharacters as avatarCharacters,
	indexedAvatarBackgrounds as avatarBackgrounds,
	indexedAvatarAccents as avatarAccents,
	indexedAvatarColorations as avatarColorations
} from '@/data/avatar/avatars.js';
import bellShop from './bell-shop.json' assert { type: "json"};

/*
 * Get PWPs for game.
 */
export function getPWPs(gameId)
{
	switch (gameId)
	{
		case constants.gameIds.ACNL:
			return acnlPwps;
		default:
			return [];
	}
}

/*
 * Get Bell Shop Categories
 */
export function getBellShopCategories()
{
	return bellShop[0];
}

export const sortedBellShopItems = getSortedBellShopItems();

/*
 * Get Bell Shop Items.
 */
export function getSortedBellShopItems()
{
	const bellShopItems = bellShop[1];
	const categories = getBellShopCategories();

	let sortedBellShopItems = {
		'all': {},
		'price': {},
	};

	bellShopItems.map(item => {
		const categoryName = categories.find(c => c.id === item.categoryId).name;
		const expireDurationMonths = item.hasOwnProperty('expireDurationMonths') ? item.expireDurationMonths : null;

		const modifiedItem = {
			id: item.id,
			internalId: item.internalId,
			name: item.name,
			description: item.hasOwnProperty('description') ? item.description : null,
			avatar: [constants.bellShop.categories.avatarBackgrounds, constants.bellShop.categories.avatarCharacters, constants.bellShop.categories.avatarAccents, constants.bellShop.categories.backgroundColorations].includes(categoryName) ? {
				background: categoryName === constants.bellShop.categories.avatarBackgrounds ? avatarBackgrounds[item.internalId] : null,
				character: categoryName === constants.bellShop.categories.avatarCharacters ? avatarCharacters[item.internalId] : null,
				accent: categoryName === constants.bellShop.categories.avatarAccents ? avatarAccents[item.internalId] : null,
				accentPosition: categoryName === constants.bellShop.categories.avatarAccents && avatarAccents[item.internalId].positionable ? 4 : null,
				coloration: categoryName === constants.bellShop.categories.backgroundColorations ? avatarColorations[item.internalId] : null,
			} : null,
			expireDurationMonths: expireDurationMonths,
			expires: expireDurationMonths === null ? null :
				dateUtils.formatDate(dateUtils.addToCurrentDateTimezone(expireDurationMonths, 'months')),
			prices: item.prices.map(price => {
				return {
					id: price.id,
					price: `${Number(price.price).toLocaleString()} ${price.currency}`,
					nonFormattedPrice: Number(price.price),
					isBells: price.currency === constants.bellShop.currencies.bells,
					currency: price.currency,
				};
			}),
			releaseDate: item.releaseDate,
		};

		if (!sortedBellShopItems.hasOwnProperty(item.categoryId))
		{
			sortedBellShopItems[item.categoryId] = [];
		}

		sortedBellShopItems[item.categoryId].push(modifiedItem);
		sortedBellShopItems['all'][item.id] = modifiedItem;

		modifiedItem.prices.map(price => {
			if (!sortedBellShopItems['price'].hasOwnProperty(price.id))
			{
				sortedBellShopItems['price'][price.id] = [];
			}

			sortedBellShopItems['price'][price.id][modifiedItem.id] = {
				'item': modifiedItem,
				'price': price,
			};
		})
	});

	// show most recent items first
	categories.map(c => {
		sortedBellShopItems[c.id] = sortedBellShopItems[c.id].sort((a, b) => {
			let dateA = dateUtils.toDate(a.releaseDate);
			let dateB = dateUtils.toDate(b.releaseDate);

			return dateB - dateA;
		});
	});

	return sortedBellShopItems;
}