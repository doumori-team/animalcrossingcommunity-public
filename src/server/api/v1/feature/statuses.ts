import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, FeatureStatusType } from '@types';

async function statuses(this: APIThisType): Promise<FeatureStatusType[]>
{
	return await db.cacheQuery(constants.cacheKeys.featureStatuses, `
		SELECT
			feature_status.id,
			feature_status.name,
			feature_status.description,
			feature_status.sequence
		FROM feature_status
		ORDER BY feature_status.sequence ASC
	`);
}

statuses.permissions = [
	'userId',
];

export default statuses;
