import { UserLiteType } from '../user/userLiteType.ts';
import { UserType } from '../user/userType.ts';
import { BanLengthType } from '../user/banLengthType.ts';
import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/user_ticket
type UserTicketType = {
	id: number
	assignee: UserLiteType
	status: string
	formattedLastUpdated: string
	rule: string|null
	violation: string|null
	formattedClosed: string|null
	formattedCreated: string
	reportedUsers?: {
		id: number
		submitted: string
		username: string
		formattedSubmitted: string
	}[]
	denyReason: string
	violator: UserType
	type: {
		description: string
		identifier: string
	}
	submitter: UserLiteType
	reference: {
		id: number
		url: string
		text: string
		format: MarkupStyleType
		parentId: number
		boardId: number|null
	}
	updatedContent: string
	action: {
		name: string
		identifier: string
	}
	messages: {
		id: number
		user: UserLiteType
		formattedDate: string
		message: string
		staffOnly: boolean
		format: MarkupStyleType
	}[]
	info: string
	ban: {
		id: number
		description: string
		days: number
	} | null
	currentBan?: BanLengthType | null
	supportTickets: {
		id: number
		title: string
	}[]
};

export type { UserTicketType };