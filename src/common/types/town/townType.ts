import { CharacterType } from './characterType.ts';
import { ACGamePWPType } from '../data/pwpsType.ts';
import { ResidentsType } from '../data/residentsType.ts';
import { UserLiteType } from '../user/userLiteType.ts';

type FruitType = {
	id: number
	name: string
	group: string
};

type StoreType = {
	id: number
	name: string
};

// based on v1/town
type TownType = {
	id: number
	name: string
	game: {
		id: number
		name: string
		shortname: string
		mapX: number
		mapY: number
		identifier: string
	}
	userId: number
	grassShape: {
		id: number
		name: string
	}
	dreamAddress: string|null
	ordinance: {
		id: number|null
		name: string|null
	}
	fruit: {
		id: number
		name: string
		group: string
	}[]
	nativeFruit: {
		all: FruitType[]
		regular: FruitType[]
		island1: FruitType[]
		island2: FruitType[]
		special: FruitType[]
		nativeFruitId: number|null
		islandFruitId1: number|null
		islandFruitId2: number|null
	}
	stores: {
		nook: StoreType[]
		others: StoreType[]
	}
	pwps: ACGamePWPType[]
	residents: ResidentsType[number]
	island: {
		id: number
		name: string
		resident: ResidentsType[number][number]
	} | null
	characters: CharacterType[]
	mapTiles: number[]
	hemisphere?: {
		id?: number
		name?: string
	}
	tune: {
		id: number
		name: string
		creator: UserLiteType
		notes: number[]
		formattedDate: null
	} | null
	museum: {
		count: number
		total: number
		name: string
	}[]
	mapDesignData: {
		dataUrl: string
		colorData: string[]
		cursorData: string[]
		flipData: string[]
		imageData: string[]
	} | null
	flag: {
		id: number|null
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
};

export type { TownType };