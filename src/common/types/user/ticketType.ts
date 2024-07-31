import { UserType } from './userType.ts';
import { UserLiteType } from './userLiteType.ts';
import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/users/ticket
type TicketType = {
	id: number
	rule: string|null
	violation: string|null
	formattedClosed: string|null
	violator: UserType
	type: {
		identifier: string
		description: string
	},
	reference: {
		id: string
		url: string|null
		text: string|null
		format: MarkupStyleType|null
		parentId: number|null
	},
	updatedContent: string|null
	action: {
		name: string
		identifier: string
	},
	messages: {
        id: number
        user: UserLiteType|null
        formattedDate: string
        message: string
        format: MarkupStyleType
	}[]
	banLength: string
};

export type { TicketType };