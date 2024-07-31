import { UserType } from '../user/userType.ts';
import { UserRatingType } from '../user/userRatingType.ts';
import { ACGameType } from '../acgame/acgameType.ts';
import { OfferType } from './offerType.ts';
import { UserLiteType } from '../user/userLiteType.ts';
import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/listing
type ListingType = {
	id: number
	creator: UserType & UserRatingType
	formattedDate: string
	game: ACGameType | null
	offers: {
		total: number
		accepted: OfferType | null
		list: OfferType[]
	}
	comments: {
		id: number
		user: UserLiteType
		formattedDate: string
		comment: string
		format: MarkupStyleType
	}[]
	formattedLastUpdated: string
	bells: number
	items: OfferType['items']
	residents: OfferType['residents']
	comment: OfferType['comment']
	status: string
	rating: OfferType['rating']
	type: string
	character: OfferType['character']
	friendCode: OfferType['friendCode']
	dodoCode: OfferType['dodoCode']
	completed: OfferType['completed']
	failed: OfferType['failed']
	address: OfferType['address']
	bioLocation: OfferType['bioLocation']
};

export type { ListingType };