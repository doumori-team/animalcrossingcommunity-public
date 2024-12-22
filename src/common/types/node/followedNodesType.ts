import { NodeChildNodesType } from './nodeChildNodesType.ts';

type FollowedNodesType = {
	results: NodeChildNodesType[]
	page: number
	pageSize: number
	totalCount: number
	type: 'board' | 'thread'
};

export type { FollowedNodesType };
