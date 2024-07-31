import { FriendCodeType } from './friendCodeType.ts';

// based on v1/friend_code/whitelist/friend_codes
type WhitelistFriendCodesType = {
    results: FriendCodeType[]
    count: number
    page: number
    pageSize: number
    games: {
        id: number
        name: string
        pattern: string
        placeholder: string
        consoleName: string
        acGameId: number
    }[]
};

export type { WhitelistFriendCodesType };