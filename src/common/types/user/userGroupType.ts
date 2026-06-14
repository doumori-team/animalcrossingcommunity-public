// based on v1/user_groups
type UserGroupType = {
	id: number
	identifier: string
	name: string
	groups?: UserGroupType[]
};

export type { UserGroupType };
