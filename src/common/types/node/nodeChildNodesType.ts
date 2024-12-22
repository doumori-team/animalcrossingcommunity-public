import { UserLiteType } from '../user/userLiteType.ts';
import { UserType } from '../user/userType.ts';
import { UserDonationsType } from '../user/userDonationsType.ts';
import { FileType } from '../fileType.ts';
import { MarkupFormatType, MarkupStyleType } from '../markupFormatType.ts';

type NodeChildNodesType = {
	id: number
	type: string
	parentId: number
	revisionId: number
	title: string
	created: string
	formattedCreated: string
	locked: boolean
	threadType: string
	edits: number
	followed: boolean
	numFollowed: number
	board: string
	user: UserLiteType | UserType | null
	content: {
		text: string
		format: MarkupFormatType
	} | null,
	lastReply: string | null
	users: {
		id: string
		username: string
		granted: boolean
	}[],
	permissions: string[]
	latestPage: string | null
	latestPost: string | null
	replyCount: number
	unread: boolean
	unreadTotal: number | null
	files: FileType[]
	showImages: boolean
	conciseMode: number
	userDonations: UserDonationsType
	markupStyle?: MarkupStyleType
};

export type { NodeChildNodesType };
