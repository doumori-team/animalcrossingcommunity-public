import { UserLiteType } from '../user/userLiteType.ts';
import { BanLengthType } from '../user/banLengthType.ts';
import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/support_ticket
type SupportTicketType = {
	id: number
	staffOnly: boolean
	title: string
	user: UserLiteType
	formattedCreated: string
	userTicketId: number | null
	ban: {
		id: number
		description: string
		days: number
	} | null
	currentBan?: BanLengthType | null
	messages: {
		id: number
		user: UserLiteType | null
		formattedDate: string
		message: string
		staffOnly: boolean
		format: MarkupStyleType
	}[]
	status: string
};

export type { SupportTicketType };
