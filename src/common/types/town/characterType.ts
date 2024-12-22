import { UserLiteType } from '../user/userLiteType';

// based on v1/character
type CharacterType = {
	id: number
	name: string
	town: {
		id: number
		name: string
		game: {
			id: number
			shortname: string
		}
	}
	game: {
		id: number
		shortname: string
		identifier: string
	}
	bells: number
	debt: number
	hraScore: number
	bedLocation: {
		id: number | null
		filename: string | null
	}
	face: {
		id: number | null
		filename: string | null
	}
	userId: number
	houseSizes: {
		id: number
		name: string
		groupId: number
	}[]
	nookMiles: number
	catalogTotal: number
	happyHomeNetworkId: string | null
	creatorId: string | null
	museumTotal: number
	paint: {
		id: number
		name: string
		hex: string
	} | null
	doorPattern: {
		id: number | null
		name: string
		creator: UserLiteType
		published: boolean
		dataUrl: string
		gameId: number
		gameShortName: string
		formattedDate: null
		isFavorite: null
		designId: null
	} | null
	monument: {
		id: number
		name: string
	} | null
};

export type { CharacterType };
