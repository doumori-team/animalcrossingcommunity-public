import { UserLiteType } from '../user/userLiteType.ts';
import { UserType } from '../user/userType.ts';
import { UserDonationsType } from '../user/userDonationsType.ts';
import { FileType } from '../fileType.ts';
import { MarkupFormatType, MarkupStyleType } from '../markupFormatType.ts';
import { NodeCategoryType } from './nodeCategoryType.ts';
import { UserPollType } from '../user/userPollType.ts';

type NodeChildNodesType = {
	id: number
	type: string
	parentId: number
	parentId2: number
	revisionId: number
	postNumber: number
	page: number
	title: string
	created: string
	formattedCreated: string
	locked: boolean
	threadType: string
	edits: number
	followed: boolean
	notified: boolean
	numFollowed: number
	board: string
	user: UserLiteType | UserType | null
	content: {
		text: string
		format: MarkupFormatType
	} | null
	lastReply: string | null
	users: {
		id: string
		username: string
		granted: boolean
	}[]
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
	forumCategory?: NodeCategoryType
	nodeQuotes: {
		nodeId: number
		sortOrder: number
		page: number
	}[]
	reactions: {
		emoji: string
		src: string
		count: number
		usedByUser: boolean
	}[]
	hidePostEmojis: boolean
	polls: UserPollType[]
};

export type { NodeChildNodesType };
