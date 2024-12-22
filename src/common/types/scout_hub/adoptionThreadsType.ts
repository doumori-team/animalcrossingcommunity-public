// based on v1/scout_hub/threads
type AdoptionThreadsType = {
	threads: {
		id: number
		scoutId: number
		scoutUsername: string
		adopteeId: number
		adopteeUsername: string
		adopted: string
		lastUpdated: string | null
		hasPermission: boolean
	}[]
	count: number
	page: number
	adoptee: string
	pageSize: number
	newMembers: string
	locked: string
	scoutIds: number[]
	scouts: {
		id: number
		name: string
	}[]
};

export type { AdoptionThreadsType };
