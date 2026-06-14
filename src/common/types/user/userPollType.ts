type UserPollType = {
	id: number
	sortOrder: number
	options: {
		description: string
		sequence: number
		votes: number
	}[]
	userVoted: boolean
	totalUsers: number
	active: boolean
};

export type { UserPollType };
