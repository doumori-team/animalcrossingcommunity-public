import { RatingType } from '../ratingType.ts';

// based on v1/users/rating_received
type RatingsReceivedType = {
	results: RatingType[]
	count: number
	page: number
	pageSize: number
	type: string
};

export type { RatingsReceivedType };
