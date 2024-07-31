type APIThisType = {
	query: (method: string, params?: any, tryCache?: boolean) => any,
	userId: number | null
}

export type { APIThisType };