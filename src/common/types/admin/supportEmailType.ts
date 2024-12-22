// based on v1/support_email
type SupportEmailType = {
	id: number
	fromUser: {
		id: number | null
		email: string
		username: string | null
	} | null
	toUser: {
		id: number
		email: string
		username: string
	} | null
	formattedRecorded: string
	subject: string
	body: string
	read: boolean
};

export type { SupportEmailType };
