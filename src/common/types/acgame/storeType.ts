// based on v1/acgame/store
type StoreType = {
	others: {
		id: number
		name: string
	}[]
	nooks: {
		id: number
		name: string
		filename?: string
	}[]
};

export type { StoreType };
