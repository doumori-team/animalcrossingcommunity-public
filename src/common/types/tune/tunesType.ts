import { TuneType } from './tuneType.ts';

// based on v1/tunes
type TunesType = {
    results: TuneType[]
    count: number
    page: number
    name: string
    creator: string
    pageSize: number
};

export type { TunesType };