type BuddiesType = {
	buddies: {
		id: number
		username: string
		lastActiveTime: string | null
	}[]
	staff: {
		id: number
		username: string
		lastActiveTime: string | null
	}[]
};

export type { BuddiesType };
