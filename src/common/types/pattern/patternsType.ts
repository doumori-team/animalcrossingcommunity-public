import { PatternType } from './patternType.ts';

// based on v1/patterns
type PatternsType = {
	results: PatternType[]
	count: number
	page: number
	name: string
	creator: string
	pageSize: number
	favorite: string
	published: string
	games: number[]
};

export type { PatternsType };
