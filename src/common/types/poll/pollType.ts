// based on v1/poll
type PollType = {
	id: number
	question: string
	startDate: string
	endDate: string
	duration: number
	isMultipleChoice: boolean
	isEnabled: boolean
	userHasVoted: boolean
	description: string
	options: {
		description: string
		sequence: number
		votes: number
	}[]
}

export type { PollType };