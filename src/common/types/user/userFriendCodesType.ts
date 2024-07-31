import { FriendCodeType } from '../friend_code/friendCodeType.ts';

// based on v1/users/friend_codes
type UserFriendCodesType = {
    results: FriendCodeType[]
    count: number
    page: number
    pageSize: number
};

export type { UserFriendCodesType };