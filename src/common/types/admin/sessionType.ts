import { UserLiteType } from '../user/userLiteType.ts';

// based on v1/session/session
type SessionType = {
	results: {
		id: number
		user: UserLiteType
		urls: {
			formattedDate: string
			url: string
			params: string | null
			query: string | null
		}[]
	}
	count: number
	page: number
	pageSize: number
	url: string
};

export type { SessionType };
