import { ListingType } from '../trading_post/listingType.ts';

// based on v1/users/offers
type UserOffersType = {
    results: ListingType[]
    count: number
    page: number
    pageSize: number
};

export type { UserOffersType };