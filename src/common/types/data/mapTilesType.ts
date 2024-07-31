type MapTilesType = {
    org: {
        paletteDisplay: boolean
        paletteGroupId: number
        paletteGroupName: string
        paletteGroups: {
            acres: string[]
            groupId: number
            groupName: string
            parentMapTile: {
                child_id1: number|null
                child_id2: number|null
                id: number
                img_name: string
                parent_id: number
            }
            styleMapTiles: {
                child_id1: number|null
                child_id2: number|null
                id: number
                img_name: string
                parent_id: number
            }[]
            unique: boolean
        }[]
    }[]
    all: {
        child_id1: number|null
        child_id2: number|null
        id: number
        img_name: string
        parent_id: number
        unchangeable: boolean
    }[]
    uniqueGroups: number[]
    grassTileId: number
};

export type { MapTilesType };