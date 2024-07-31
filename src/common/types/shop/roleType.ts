// based on v1/shop/roles
type RoleType = {
    id: number
    name: string
    description: string
    positionsAvailable: number
    games: {
        id: number
        name: string
    }[]
    parentId: number | null
    services: {
        id: number
        name: string
    }[]
    apply: boolean
    contact: boolean
    active: boolean
    applications: boolean
};

export type { RoleType };