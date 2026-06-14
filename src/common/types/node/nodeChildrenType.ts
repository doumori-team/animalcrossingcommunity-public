import { constants } from '@utils';
import { NodeChildNodesType } from './nodeChildNodesType.ts';

const _ = constants.orderOptions.node.map(x => x.id);

type NodeChildrenType = {
	childNodes: NodeChildNodesType[]
	count: number
	page: number
	pageSize: number
	order: typeof _[number]
	reverse: boolean,
	showLocked: boolean,
};

export type { NodeChildrenType };
