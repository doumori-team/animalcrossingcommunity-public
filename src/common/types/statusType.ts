import { UserType } from './user/userType.ts';

// based on v1/status
type StatusType = {
	user: UserType | null
	permissions: string[]
	southernHemisphere: boolean
	dockMenu: boolean
	banLength?: string
};

export type { StatusType };
