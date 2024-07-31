import { PollType } from './pollType.ts';

type HomePollsType = {
    currentPoll: PollType|null
    previousPoll: PollType|null
}

export type { HomePollsType }