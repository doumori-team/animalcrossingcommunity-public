import { MarkupFormatType } from '../markupFormatType.ts';

// based on v1/shop
type ShopType = {
	id: number
	name: string
	shortDescription: string
	description: {
		content: string
		format: MarkupFormatType
	},
	formattedDate: string
	free: boolean
	vacation: {
		formattedStartDate: string
		formattedEndDate: string
		current: boolean
		startDate: string
		endDate: string
	} | null
	transfer: boolean
	active: boolean
	header: string | null
	fileId: string | null
	owners: {
		id: number
		username: string
	}[]
	games: {
		id: number
		name: string
		shortname: string
		perOrder: number
		stackOrQuantity: boolean
		completeOrder: boolean
		items: string[]
		color: string
	}[]
	pendingOrder: boolean
	positiveRatingsTotal: number
	neutralRatingsTotal: number
	negativeRatingsTotal: number
	statData: any[]
	statsUsers: {
		id: number
		username: string
	}[]
	extraStatData: {
		stats: any[]
		employees: {
			id: number
			username: string
			lastActiveTime: string | null
		}[]
	} | null
};

export type { ShopType };
