import { FileType } from '../fileType.ts';
import { MarkupFormatType } from '../markupFormatType.ts';

type AnnouncementsType = {
	id: number
	title: string
	userId: number
	content: {
		text: string
		format: MarkupFormatType
	}
	created: string
	files: FileType[]
	reactions: {
		emoji: string
		src: string
		count: number
	}[]
};

export type { AnnouncementsType };
