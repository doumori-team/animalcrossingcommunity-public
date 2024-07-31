// based on v1/admin/rule
type RuleType = {
	id: number
	number: number
	name: string
	description: string
	categoryId: number
	reportable: boolean
};

export type { RuleType };