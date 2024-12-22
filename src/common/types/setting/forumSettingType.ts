import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/settings/forum
type ForumSettingType = {
	signature: string | null
	format: MarkupStyleType
	userTitle: string | null
	flagOption: string
	markupStyle: MarkupStyleType
	showImages: boolean
	conciseMode: number
};

export type { ForumSettingType };
