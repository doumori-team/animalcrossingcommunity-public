type ResidentType = {
    id: string
    name: string
    isTown: boolean
    isIsland: boolean
    gameId: number
    birthday: string|null
};

type ResidentsType = {
    [id: number]: ResidentType[]
};

export type { ResidentsType };