// based on accounts getUserData
type AccountUserType = {
    id: number
    username: string
    email: string
    signup_date: string
    signup_date_legacy: string
    birth_date: {
        day: number
        month: number
        year: number
    }
    production: boolean
    address: string|null
    consent_given: boolean
    username_history: {
        id: number
        username: string
        changed: string
    }[]
}

export type { AccountUserType };