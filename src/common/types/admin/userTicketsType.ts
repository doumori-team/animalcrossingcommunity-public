import { UserTicketType } from './userTicketType.ts';

// based on v1/user_tickets
type UserTicketsType = {
	results: UserTicketType[]
	count: number
	page: number
	statusId: number
	assignee: string
	ruleId: number
	typeId: number
	pageSize: number
	violator: string
	denyReasonId: number
};

export type { UserTicketsType };
