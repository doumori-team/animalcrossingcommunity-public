type BuddiesType = {
	buddies: {
		id: number
		username: string
		lastActiveTime: string
	}[]
	staff: {
		id: number
		username: string
		lastActiveTime: string
	}[]
};

export type { BuddiesType };