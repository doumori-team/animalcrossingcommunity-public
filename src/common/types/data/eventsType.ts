type EventType = {
	displayName: string
	dateVariesByYear: boolean
	startDate?: string
	startTime?: string
	endTime?: string
	notes?: string
	region?: string
	// AC:NH only
	name?: string
	type?: string
	// also each year that game is active
};

// see: constants.gameIds
type EventsType = {
	[id: number]: EventType[]
};

export type { EventsType };
