// based on v1/shop/thread
type ThreadOrderType = {
	id: number
	nodeId: number | null
	employee: {
		id: number
		username: string
	} | null
	customer: {
		id: number
		username: string
	},
	shop: {
		id: number
		name: string
	},
	formattedDate: string
	service: string
	status: 'Completed' | 'In Progess' | 'Unclaimed'
	comment: string
	items: {
		id: string
		quantity: number
		name: string
	}[]
	claim: boolean
	game: {
		id: number
		shortname: string
	}
};

export type { ThreadOrderType };
