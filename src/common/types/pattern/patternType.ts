import { UserLiteType } from '../user/userLiteType.ts';

// based on v1/pattern
type PatternType = {
	id: number
	name: string
	creator: UserLiteType
	formattedDate: string
	published: boolean
	isFavorite: boolean
	designId: string | null
	data: string[]
	dataUrl: string
	gameId: number
	paletteId: number
	gameShortName: string
	qrCodeUrl: string | null
};

export type { PatternType };
