import { MarkupStyleType } from './markupFormatType.ts';

// based on v1/newsletter/article
type NewsletterArticleType = {
	id: number
	newsletterId: number
	type: 'text' | 'quiz' | 'silhouette'
	title: string
	content: string
	issue: number
	sortOrder: number
	published: boolean
	questions: {
		text: string
		options: {
			text: string
			answer: boolean
		}[]
	}[]
	silhouettes: {
		answer: string
		answerAdditional: string
		silhouetteFileId: string | null
		answerFileId: string | null
		silhouetteFile?: string
		answerFile?: string
	}[]
	comments: {
		id: number
		user: {
			id: number
			username: string
		}
		formattedDate: string
		message: string
		format: MarkupStyleType
	}[]
};

export type { NewsletterArticleType };
