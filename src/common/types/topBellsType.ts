import { constants } from '@utils';

const orderOptions = constants.orderOptions.topBells.map(x => x.id);

type TopBellsType = {
	results: {
		id: number
		username: string
		rank: number
		totalBells: string
		missedBells: string
		totalJackpotBells: string
		jackpotsFound: number
		jackpotsMissed: number
	}[]
	count: number
	page: number
	pageSize: number
	username: string
	order: typeof orderOptions[number]
	reverse: boolean
	lastJackpot: {
		username: string
		formattedOffered: string
		amount: string
	} | null,
};

export type { TopBellsType };