import { PollType } from '../poll/pollType.ts';

// based on v1/admin/polls
type PollsType = {
	results: PollType[]
	count: number
	page: number
	pageSize: number
};

export type { PollsType };
