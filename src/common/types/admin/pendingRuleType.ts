// based on v1/rule/pending
type PendingRuleType = {
	id: number
	number: number
	name: string | null
	startDate: string | Date | null
	description: string
	violations: {
		id: number
		severityId: number | null
		violation: string
		pendingExpiration: boolean
		startDate: string | Date | null
	}[]
	pendingExpiration: boolean
	pendingRule: {
		id: number
		number: number
		name: string | null
		startDate: string | Date | null
		description: string
		category: string
		reportable: boolean
	} | null
	pendingViolations: {
		id: number
		number: number
		severityId: number | null
		violation: string
		pendingExpiration: boolean
		startDate: string | Date | null
		pendingViolation: {
			id: number
			severityId: number | null
			violation: string
		} | null
	}[]
	category: string
	reportable: boolean
};

export type { PendingRuleType };
