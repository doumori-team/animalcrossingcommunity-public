import { ACGameItemType } from '../data/acGameItemType.ts';

// based on v1/shop/catalog
type ShopCatalogType = {
    gameId: number
    items: ACGameItemType[number]['all']['items']
};

export type { ShopCatalogType };