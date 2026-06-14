import { NodeCategoryType } from './nodeCategoryType';

// based on v1/node/boards
type NodeBoardType = {
	id: number
	type: string
	parentId: number | null
	parentId2: number | null
	title: string
	content: {
		text: string
		format: string
	},
	followed: boolean
	notified: boolean
	boardType: string
	forumCategory?: NodeCategoryType
};

export type { NodeBoardType };
