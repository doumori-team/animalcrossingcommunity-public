type RuleType = {
	id: number
	number: number
	name: string|null
	startDate: string
	description: string
	violations: {
		id: number
		severityId: number|null
		violation: string
		number: number
	}[]
	originalRuleId: number|null
	categoryId: number
	category: string
	reportable: boolean
};

// based on v1/rule/current
type CurrentRuleType = {
    currentRules: {
        id: number
        name: string
        rules: RuleType[]
    }[]
    lastUpdated: string
};

export type { CurrentRuleType };