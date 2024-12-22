import { MarkupStyleType } from '../markupFormatType.ts';

// based on v1/scout_hub/settings
type ScoutSettingsType = {
	welcomeTemplate: string | null
	closingTemplate: string | null
	welcomeTemplateFormat: MarkupStyleType
	closingTemplateFormat: MarkupStyleType
};

export type { ScoutSettingsType };
