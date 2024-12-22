import { BellShopItemsType } from '../data/bellShopItemsType.ts';

// based on v1/users/bell_shop/items
type UserBellShopItemType = {
	id: number
	itemId: number
	name: BellShopItemsType['all'][number]['name']
	description: BellShopItemsType['all'][number]['description']
	avatar: BellShopItemsType['all'][number]['avatar']
	redeemed: string
	price: string
	expires: string | null
	redeemedBy: string | null
};

export type { UserBellShopItemType };
