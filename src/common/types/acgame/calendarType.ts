type CalendarType = {
	game: {
		id: number
		name: string
	}
	months: {
		id: number
		name: string
		year: number
		categories: {
			name: string
			identifier: string
			events: {
				name: string
				timing: string
				sortDate?: Date | string
				img?: string
			}[]
		}[]
	}[]
};

export type { CalendarType };
