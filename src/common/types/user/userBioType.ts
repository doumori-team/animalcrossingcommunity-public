import { FileType } from '../fileType.ts';
import { MarkupFormatType } from '../markupFormatType.ts';
import { UserPollType } from './userPollType.ts';

// based on v1/users/bio
type UserBioType = {
	location: string | null
	name: string | null
	bio: string | null
	format: MarkupFormatType
	email: string | null
	files: FileType[]
	polls: UserPollType[]
};

export type { UserBioType };
