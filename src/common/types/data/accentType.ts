type AccentType = {
	id: number
	name: string
	subtitle?: string
	game?: string
	image: string
	positionable: boolean
	zIndex: number
	tags: string[]
	permissions?: string[]
	dateRestricted: boolean
};

export type { AccentType };
