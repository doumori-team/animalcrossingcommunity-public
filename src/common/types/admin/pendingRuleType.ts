// based on v1/rule/pending
type PendingRuleType = {
    id: number
    number: number
    name: string
    startDate: string
    description: string
    violations: {
        id: number
        severityId: number|null
        violation: string
        pendingExpiration: boolean
        startDate: string
    }[]
    pendingExpiration: boolean
    pendingRule: {
        id: number
        number: number
        name: string
        startDate: string
        description: string
        category: string
        reportable: boolean
    } | null
    pendingViolations: {
        id: number
        number: number
        severityId: number|null
        violation: string
        pendingExpiration: boolean
        startDate: string
        pendingViolation: {
            id: number
            severityId: number|null
            violation: string
        } | null
    }[]
    category: string
    reportable: boolean
};

export type { PendingRuleType };