// based on v1/settings/calendar
type CalendarSettingType = {
    categories: {
        id: number
        identifier: string
        name: string
    }[]
	games: {
        id: number
        hemisphereId: number | null
        homepage: boolean
        categoryIds: number[]
    }[]
};

export type { CalendarSettingType };