// based on v1/rating
type RatingType = {
	id: number
	username: string
	ratingUsername: string
	formattedDate: string
	rating: string
	comment: string
	listingId: number|null
	adoptionNodeId: number|null
	shopNodeId: number|null
};

export type { RatingType };