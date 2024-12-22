type SiteStatsType = {
	results: {
		label: string
		number: string
	}[]
	date: string
	lineGraphStats: {
		statData: {
			[id: string]: string | number
		}[]
		lines: string[]
	}
	barGraphStats: {
		name: string
		data: {
			year: number
			[id: string]: number
		}[]
	}[]
};

export type { SiteStatsType };
