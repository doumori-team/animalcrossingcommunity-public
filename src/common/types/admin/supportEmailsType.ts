import { SupportEmailType } from './supportEmailType.ts';

// based on v1/support_emails
type SupportEmailsType = {
    results: SupportEmailType[]
    count: number
    page: number
    pageSize: number
    fromUser: string
    fromEmail: string
    toUser: string
    toEmail: string
    startDate: string
    endDate: string
    read: string
    forUser: string
};

export type { SupportEmailsType };