// based on v1/newsletter
type NewsletterType = {
	id: number
	issue: number
	volume: number
	issueDate: string
	formattedIssueDate: string
	pdfOnly: boolean
	pdfDownload: string | null
	header: string
	published: boolean
};

export type { NewsletterType };
