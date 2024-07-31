import { FeatureType } from './featureType.ts';

// based on v1/features
type FeaturesType = {
    results: FeatureType[]
    count: number
    page: number
    pageSize: number
    statusId: string
    categoryId: number
    isBug: string
    following: string
	staffOnly: string
	readOnly: string
	createdUser: string
	assignedUser: string
};

export type { FeaturesType };