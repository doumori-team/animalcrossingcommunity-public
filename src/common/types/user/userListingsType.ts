import { ListingType } from '../trading_post/listingType.ts';

// based on v1/users/listings
type UserListingsType = {
	results: ListingType[]
	count: number
	page: number
	pageSize: number
};

export type { UserListingsType };
