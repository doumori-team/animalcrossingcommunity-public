type GroupItemType = {
	categoryName: string
	total: number
	count: number
	groups: {
		groupName: string
		total: number
		items: {
			id: string
			name: string
			position: number
			categoryName: string
			museum: boolean
			genuine: boolean
			tradeable: boolean
		}[]
	}[]
};

type ACGameItemType = {
	[id: number]: {
		[id: string]: {
			theme: GroupItemType[]
			alphabetical: GroupItemType[]
			catalog: GroupItemType[]
		}
		all: {
			theme: GroupItemType[]
			alphabetical: GroupItemType[]
			catalog: GroupItemType[]
			items: GroupItemType['groups'][0]['items']
		}
	}
};

export type { ACGameItemType, GroupItemType };
