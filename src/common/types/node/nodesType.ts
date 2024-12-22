import { NodeType } from './nodeType.ts';
import { NodeChildNodesType } from './nodeChildNodesType.ts';
import { NodeBoardType } from './nodeBoardType.ts';
import { EmojiSettingType } from '../setting/emojiSettingType.ts';
import { constants } from '@utils';
import { UserDonationsType } from '../user/userDonationsType.ts';

const _orderOptions = constants.orderOptions.node.map(x => x.id);

// based on v1/nodes.ts
type NodesType = {
	node: NodeType
	breadcrumb: {
		id: number,
		title: string
	}[]
	childNodes: NodeChildNodesType[]
	page: number
	totalCount: number
	pageSize: number
	reverse: boolean
	order: typeof _orderOptions[number]
	locked: boolean
	editNode: NodeType | null
	currentUserEmojiSettings: EmojiSettingType[]
	nodeUsersEmojiSettings: EmojiSettingType[]
	boards: NodeBoardType[]
	subBoards: NodeBoardType[]
	staffBoards: number[]
	archivedBoards: number[]
	listBoards: number[]
	userDonations: UserDonationsType
};

export type { NodesType };
