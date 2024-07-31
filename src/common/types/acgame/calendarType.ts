type CalendarType = {
	game: {
		id: number
		name: string
	} | any
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
				sortDate?: string
				img?: string
			}[]
		}[]
	}[] | any
};

export type { CalendarType };