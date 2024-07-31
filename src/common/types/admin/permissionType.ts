type ChildBoardType = {
	id: number
	name: string
	parentId: number|null
	grantedTypes: {
		id: number
		granted: boolean
		identifier: string
	}[]
	boards: ChildBoardType[]
}

// based on v1/users/permissions, v1/admin/user_group/permissions
type PermissionType = {
    site: {
        id: number
        description: string
        granted: boolean
    }[]
    forum: {
        types: {
            id: number
            description: string
            identifier: string
        }[]
        boards: ChildBoardType[]
    },
};

export type { PermissionType };