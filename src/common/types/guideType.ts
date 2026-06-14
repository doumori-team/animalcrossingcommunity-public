import { UserLiteType } from './user/userLiteType.ts';

// based on v1/guide
type GuideType = {
	id: number
	name: string
	description: string
	content: string
	game: {
		id: number
		shortname: string
	}
	updatedName?: string | null
	updatedDescription?: string | null
	updatedContent?: string | null
	formattedLastUpdated?: string
	user?: UserLiteType
	formattedLastPublished?: string
	hasChanges?: boolean
};

export type { GuideType };
