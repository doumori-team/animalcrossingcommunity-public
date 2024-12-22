import { RatingType } from '../ratingType.ts';

// based on v1/users/ratings_given
type RatingsGivenType = {
	results: RatingType[]
	count: number
	page: number
	pageSize: number
	type: string
};

export type { RatingsGivenType };
