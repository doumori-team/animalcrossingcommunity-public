import { UserType } from './userType.ts';

// based on v1/matching
type UserMatchingType = {
    results: {
        user: UserType
    }[]
    username: string
    match: string
};

export type { UserMatchingType };