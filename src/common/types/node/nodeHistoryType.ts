import { UserLiteType } from '../user/userLiteType.ts';
import { FileType } from '../fileType.ts';
import { MarkupFormatType } from '../markupFormatType.ts';

type NodeHistoryType = {
	id: number
	formattedDate: string
	user: UserLiteType
	title: string | null
	content: {
		text: string | null
		format: MarkupFormatType | null
	}
	files: FileType[]
	showImages: boolean
};

export type { NodeHistoryType };
