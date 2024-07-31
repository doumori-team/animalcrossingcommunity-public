import { UserType } from '../user/userType.ts';

// based on v1/scout_hub/adoption/totals
type AdoptionTotalsType = {
    scout: UserType
    total: number
};

export type { AdoptionTotalsType };