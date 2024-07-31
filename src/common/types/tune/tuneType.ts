import { UserLiteType } from '../user/userLiteType.ts';

// based on v1/tune
type TuneType = {
	id: number
	name: string
	creator: UserLiteType
	notes: number[]
	formattedDate: string
};

export type { TuneType };