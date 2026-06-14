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
		parentId: number | null
		positions: number
		apply: boolean
		contact: boolean
		active: boolean
		services: {
			id: string
			name: string
		}[]
		positionsAvailable: number
		applications: boolean
		stats: boolean
	}[]
};

export type { EmployeesType };
