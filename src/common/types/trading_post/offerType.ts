import { UserType } from '../user/userType.ts';
import { ResidentsType } from '../data/residentsType.ts';
import { UserRatingType } from '../user/userRatingType.ts';
import { RatingType } from '../ratingType.ts';

// based on v1/trading_post/listing/offer
type OfferType = {
	id: number
	sequence: number
	user: UserType & UserRatingType
	formattedDate: string
	status: string
	bells: number
	items: {
		id: string
		quantity: number
		secretCode: string | null
		name: string
	}[]
	residents: ResidentsType[number]
	comment: string | null
	rating: RatingType | null
	character: {
		id: number
		name: string
		town: {
			id: number
			name: string
		},
	} | null
	friendCode: string | null
	dodoCode: string | null
	completed: boolean
	failed: boolean
	address: string
	bioLocation: string | null
};

export type { OfferType };
