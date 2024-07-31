import { SupportTicketType } from './supportTicketType.ts';

// based on v1/support_tickets
type SupportTicketsType = {
    results: SupportTicketType[]
    count: number
    page: number
    pageSize: number
    username: string
    userTicketId: number|null
    status: string
};

export type { SupportTicketsType };