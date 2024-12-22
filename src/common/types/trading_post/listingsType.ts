import { ListingType } from './listingType.ts';

// based on v1/trading_post/listings
type ListingsType = {
	results: ListingType[]
	count: number
	page: number
	pageSize: number
	creator: string
	type: string
	gameId: number | null
	bells: number | null
	items: any[]
	villagers: any[]
	active: number | null
	wishlist: boolean
	bioLocation: string
	comment: string
};

export type { ListingsType };
