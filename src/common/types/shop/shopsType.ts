import { ShopType } from './shopType.ts';

// based on v1/shops
type ShopsType = {
	results: ShopType[]
	count: number
	page: number
	pageSize: number
	services: number[]
	fee: string
	vacation: string
	gameId: number | null
};

export type { ShopsType };
