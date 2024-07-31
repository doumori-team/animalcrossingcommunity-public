import { UserType } from '../user/userType.ts';
import { FileType } from '../fileType.ts';
import { UserDonationsType } from '../user/userDonationsType.ts';
import { MarkupFormatType, MarkupStyleType } from '../markupFormatType.ts';

// based on v1/node/full.ts
type NodeType = {
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
	permissions: string[]
	replyCount: number
	latestPage: number
	latestPost: number
	unread: boolean
	unreadTotal: number
	markupStyle: MarkupStyleType
	files: FileType[]
	conciseMode: number
	content: {
		text: string
		format: MarkupFormatType
	} | null
	users: {
		id: number
		username: string
		granted: boolean
		viewed: string
	}[]
	user?: UserType
	lastReply?: string
	showImages: boolean
	userDonations?: UserDonationsType
};

export type { NodeType };