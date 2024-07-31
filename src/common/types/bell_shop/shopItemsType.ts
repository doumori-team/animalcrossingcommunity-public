import { TagType } from '../avatar/tagType.ts';
import { BellShopItemsType } from '../data/bellShopItemsType.ts';

// based on v1/bell_shop/items
type ShopItemsType = {
    results: BellShopItemsType[number]
    count: number
    page: number
    pageSize: number
    sortBy: string
    groupBy: string
    tags: TagType[]
};

export type { ShopItemsType };