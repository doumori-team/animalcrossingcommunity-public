import { NodeChildNodesType } from '../node/nodeChildNodesType.ts';

// based on v1/users/threads
type UserThreadsType = {
	results: NodeChildNodesType[]
	page: number
	pageSize: number
	totalCount: number
};

export type { UserThreadsType };
