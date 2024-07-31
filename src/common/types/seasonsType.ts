type SeasonsType = {
	bg_colors: string[]
	ui_colors: {
		default: string
		light: string
		lighter: string
		dark: string
		header: string
	},
	theme: string
	season: string
	event: string|null
	bannerName: string
	debug: boolean
};

export type { SeasonsType };