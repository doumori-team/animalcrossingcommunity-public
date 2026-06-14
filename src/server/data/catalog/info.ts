import { constants, dateUtils } from '@utils';
import { ACCCache } from '@cache';
import {
	BellShopCategoryType,
	BellShopItemsType,
	PWPsType,
	DataBackgroundType,
	DataCharacterType,
	DataColorationType,
	DataAccentType,
} from '@types';
import acnlPwps from './acnl/pwps.json';
import bellShop from './bell-shop.json';

const avatarBackgrounds: DataBackgroundType[] = await ACCCache.get(constants.cacheKeys.indexedAvatarBackgrounds);
const avatarCharacters: DataCharacterType[] = await ACCCache.get(constants.cacheKeys.indexedAvatarCharacters);
const avatarColorations: DataColorationType[] = await ACCCache.get(constants.cacheKeys.indexedAvatarColorations);
const avatarAccents: DataAccentType[] = await ACCCache.get(constants.cacheKeys.indexedAvatarAccents);

export const pwps: PWPsType = {
	[constants.gameIds.ACGC]: [],
	[constants.gameIds.ACWW]: [],
	[constants.gameIds.ACCF]: [],
	[constants.gameIds.ACNL]: acnlPwps,
	[constants.gameIds.ACNH]: [],
	[constants.gameIds.ACPC]: [],
};

export const bellShopCategories: BellShopCategoryType[] = bellShop[0] as BellShopCategoryType[];

export const sortedBellShopItems = getSortedBellShopItems();

/*
 * Get Bell Shop Items.
 */
export function getSortedBellShopItems(): BellShopItemsType
{
	const bellShopItems = bellShop[1] as {
		internalId: string
		name?: string
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
		image?: string
		packs?: string[]
	}[];

	let sortedBellShopItems: BellShopItemsType = {
		'all': {},
		'price': {},
	};

	bellShopItems.map(item =>
	{
		const categoryName = bellShopCategories.find(c => c.id === item.categoryId)?.name;
		const expireDurationMonths = Object.prototype.hasOwnProperty.call(item, 'expireDurationMonths') && item.expireDurationMonths !== undefined ? item.expireDurationMonths : null;

		let avatarSource: DataBackgroundType | DataCharacterType | DataColorationType | DataAccentType | null = null;

		if (categoryName === constants.bellShop.categories.avatarBackgrounds)
		{
			avatarSource = (avatarBackgrounds as DataBackgroundType[])[item.internalId];
		}
		else if (categoryName === constants.bellShop.categories.avatarCharacters)
		{
			avatarSource = (avatarCharacters as DataCharacterType[])[item.internalId];
		}
		else if (categoryName === constants.bellShop.categories.avatarAccents)
		{
			avatarSource = (avatarAccents as DataAccentType[])[item.internalId];
		}
		else if (categoryName === constants.bellShop.categories.backgroundColorations)
		{
			avatarSource = (avatarColorations as DataColorationType[])[item.internalId];
		}

		const modifiedItem: BellShopItemsType[number]['items'][number] = {
			id: item.id,
			internalId: item.internalId,
			name: avatarSource?.name ?? (item.name ?? 'Unknown'),
			subtitle: avatarSource?.subtitle ?? null,
			game: avatarSource?.game ?? null,
			categoryId: item.categoryId,
			description: Object.prototype.hasOwnProperty.call(item, 'description') && item.description !== undefined ? item.description : null,
			avatar: avatarSource ? {
				background: categoryName === constants.bellShop.categories.avatarBackgrounds ? avatarSource as DataBackgroundType : null,
				character: categoryName === constants.bellShop.categories.avatarCharacters ? avatarSource as DataCharacterType : null,
				accent: categoryName === constants.bellShop.categories.avatarAccents ? avatarSource as DataAccentType : null,
				accentPosition:
				categoryName === constants.bellShop.categories.avatarAccents && (avatarSource as DataAccentType).positionable
					? 4
					: null,
				coloration: categoryName === constants.bellShop.categories.backgroundColorations ? avatarSource as DataColorationType : null,
			} : null,
			expireDurationMonths: expireDurationMonths,
			expires: expireDurationMonths === null ? null :
				dateUtils.formatDate3(dateUtils.addToCurrentDateTimezone(expireDurationMonths, 'months')),
			prices: item.prices.map(price =>
			{
				return {
					id: price.id,
					price: `${Number(price.price).toLocaleString()} ${price.currency}`,
					nonFormattedPrice: Number(price.price),
					isBells: price.currency === constants.bellShop.currencies.bells,
					currency: price.currency,
				};
			}),
			releaseDate: item.releaseDate,
			image: Object.prototype.hasOwnProperty.call(item, 'image') && item.image !== undefined ? item.image : null,
			packs: Object.prototype.hasOwnProperty.call(item, 'packs') && item.packs !== undefined ? item.packs : null,
		};

		if (!Object.prototype.hasOwnProperty.call(sortedBellShopItems, item.categoryId))
		{
			sortedBellShopItems[item.categoryId] = {
				'items': [],
				'packs': [],
			};
		}

		sortedBellShopItems[item.categoryId]['items'].push(modifiedItem);
		sortedBellShopItems['all'][item.id] = modifiedItem;

		modifiedItem.prices.map(price =>
		{
			if (!Object.prototype.hasOwnProperty.call(sortedBellShopItems['price'], price.id))
			{
				sortedBellShopItems['price'][price.id] = [];
			}

			sortedBellShopItems['price'][price.id][modifiedItem.id] = {
				'item': modifiedItem,
				'price': price,
			};
		});

		modifiedItem.packs?.map(packName =>
		{
			const pack = sortedBellShopItems[item.categoryId]['packs'].find(x => x.name === packName);

			if (!pack)
			{
				sortedBellShopItems[item.categoryId]['packs'].push({
					name: packName,
					items: [modifiedItem],
				});
			}
			else
			{
				pack.items.push(modifiedItem);
			}
		});
	});

	return sortedBellShopItems;
}
