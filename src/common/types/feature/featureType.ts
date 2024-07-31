import { UserLiteType } from '../user/userLiteType.ts';
import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/feature
type FeatureType = {
	id: number
	title: string
	description: string
	format: MarkupStyleType
	statusId: string
	status: string
	categoryId: number
	category: string
	isBug: boolean
	staffOnly: boolean
	readOnly: boolean
	user: UserLiteType
	formattedCreated: string
	messages: {
		id: number
		user: UserLiteType
		formattedDate: string
		message: string
		staffOnly: boolean
		format: MarkupStyleType
	}[]
	followed: boolean
	staffDescription: string
	staffDescriptionFormat: MarkupStyleType
	assignedUsers: UserLiteType[]
	claimed: boolean
};

export type { FeatureType };