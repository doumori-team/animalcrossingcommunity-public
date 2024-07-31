import { constants, dateUtils } from '@utils';
import { ACCCache } from '@cache';
import {
	BellShopCategoryType,
	BellShopItemsType,
	PWPsType,
	DataBackgroundType,
	DataCharacterType,
	DataColorationType,
	DataAccentType
} from '@types';

import acnlPwps from './acnl/pwps.json' assert { type: 'json' };
import bellShop from './bell-shop.json' assert { type: 'json'};

const avatarBackgrounds:DataBackgroundType[] = await ACCCache.get(constants.cacheKeys.indexedAvatarBackgrounds);
const avatarCharacters:DataCharacterType[] = await ACCCache.get(constants.cacheKeys.indexedAvatarCharacters);
const avatarColorations:DataColorationType[] = await ACCCache.get(constants.cacheKeys.indexedAvatarColorations);
const avatarAccents:DataAccentType[] = await ACCCache.get(constants.cacheKeys.indexedAvatarAccents);

export const pwps:PWPsType = {
	[constants.gameIds.ACGC]: [],
	[constants.gameIds.ACWW]: [],
	[constants.gameIds.ACCF]: [],
	[constants.gameIds.ACNL]: acnlPwps,
	[constants.gameIds.ACNH]: [],
	[constants.gameIds.ACPC]: [],
};

export const bellShopCategories:BellShopCategoryType[] = bellShop[0];

export const sortedBellShopItems = getSortedBellShopItems();

/*
 * Get Bell Shop Items.
 */
export function getSortedBellShopItems() : BellShopItemsType
{
	const bellShopItems = bellShop[1] as {
		internalId: string
		name: string
		categoryId: number
		id: number
		releaseDate: string
		prices: {
			id: number
			currency: string
			price: number
		}[]
		expireDurationMonths?: number
		description?: string
	}[];

	let sortedBellShopItems:BellShopItemsType = {
		'all': {},
		'price': {},
	};

	bellShopItems.map(item => {
		const categoryName = bellShopCategories.find(c => c.id === item.categoryId)?.name;
		const expireDurationMonths = item.hasOwnProperty('expireDurationMonths') && item.expireDurationMonths != null ? item.expireDurationMonths : null;

		const modifiedItem:BellShopItemsType[number][number] = {
			id: item.id,
			internalId: item.internalId,
			name: item.name,
			categoryId: item.categoryId,
			description: item.hasOwnProperty('description') && item.description != null ? item.description : null,
			avatar: categoryName != null && [constants.bellShop.categories.avatarBackgrounds, constants.bellShop.categories.avatarCharacters, constants.bellShop.categories.avatarAccents, constants.bellShop.categories.backgroundColorations].includes(categoryName) ? {
				background: categoryName === constants.bellShop.categories.avatarBackgrounds ? (avatarBackgrounds as any)[item.internalId] : null,
				character: categoryName === constants.bellShop.categories.avatarCharacters ? (avatarCharacters as any)[item.internalId] : null,
				accent: categoryName === constants.bellShop.categories.avatarAccents ? (avatarAccents as any)[item.internalId] : null,
				accentPosition: categoryName === constants.bellShop.categories.avatarAccents && (avatarAccents as any)[item.internalId].positionable ? 4 : null,
				coloration: categoryName === constants.bellShop.categories.backgroundColorations ? (avatarColorations as any)[item.internalId] : null,
			} : null,
			expireDurationMonths: expireDurationMonths,
			expires: expireDurationMonths == null ? null :
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
		});
	});

	return sortedBellShopItems;
}