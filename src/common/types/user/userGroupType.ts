// based on v1/user_groups
type UserGroupType = {
	id: number
	identifier: string
	name: string
	parent_id: number
	groups?: UserGroupType[]
};

export type { UserGroupType };