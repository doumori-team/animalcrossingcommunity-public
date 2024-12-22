// based on v1/users/new
type UsersNewType = {
	newUsers: {
		id: number
		username: string
		signupDate: string
		adopted: string
		lastActiveTime: string | null
		scoutId: number | null
		scoutUsername: string | null
	}[]
	totalCount: number
	page: number
	pageSize: number
};

export type { UsersNewType };
