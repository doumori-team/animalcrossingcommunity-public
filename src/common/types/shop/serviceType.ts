// based on v1/shop/services
type ServiceType = {
	id: number
	name: string
	description: string
	default: boolean
	games: {
		id: number
		shortname: string
	}[]
};

export type { ServiceType };
