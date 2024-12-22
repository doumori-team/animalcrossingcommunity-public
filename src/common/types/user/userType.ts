import { UserAvatarType } from './userAvatarType.ts';
import { MarkupFormatType } from '../markupFormatType.ts';

// based on v1/user
type UserType = {
	id: number
	username: string
	signupDate: string
	lastActiveTime: string
	signature: string
	signatureFormat: MarkupFormatType
	userTitle: string
	showImages: boolean
	avatar: UserAvatarType
	group: {
		id: number
		identifier: string
		name: string
	}
	bells: string
	allBells: string
	missedBells: string
	nonFormattedTotalBells: number
	adoptionThreadId: number | null
	scoutUsername: string | null
	adopteeBuddyThreadId: number | null
	awayStartDate: string | null
	awayEndDate: string | null
	reviewTOS: boolean
};

export type { UserType };
