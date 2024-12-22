// based on v1/session/sessions
type SessionsType = {
	results: {
		id: number
		formattedStartDate: string
		formattedEndDate: string | null
	}[]
	count: number
	page: number
	pageSize: number
	username: string
	startDate: string
	endDate: string
	url: string
};

export type { SessionsType };
