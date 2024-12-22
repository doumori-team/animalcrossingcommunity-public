// based on v1/shop/employees
type EmployeesType = {
	list: {
		id: number
		username: string
		role: string
	}[]
	roles: {
		id: number
		shopId: number
		name: string
		description: string
		parentId: number
		positions: number
		apply: boolean
		contact: boolean
		active: boolean
		services: {
			id: number
			name: string
		}[]
		positionsAvailable: number
		applications: boolean
		stats: boolean
	}[]
};

export type { EmployeesType };
