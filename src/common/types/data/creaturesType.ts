type CreatureType = {
    name: string
    how: string
    weather: string
    shadow: string
    catchDifficulty: string
    type: string
    timing: string
    imgName: string
    // AC:NH only
    hemispheres?: {
        [id: string]: {
            time: string[]
            timeArray: number[]
            months: string[]
            monthsArray: number[]
        }
    }
    // non-AC:NH only
    time?: string
    monthsArray?: number[]
    monthsTimesArray?: {
        monthsArray: number[]
        time: string
    }[]
};

type CreaturesType = {
    [id: string]: CreatureType[]
};

export type { CreaturesType, CreatureType };