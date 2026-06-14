import * as db from '@db';
import { constants } from '@utils';
import { APIThisType, FeatureCategoryType } from '@types';

async function categories(this: APIThisType): Promise<FeatureCategoryType[]>
{
	return await db.cacheQuery(constants.cacheKeys.featureCategories, `
		SELECT
			feature_category.id,
			feature_category.name
		FROM feature_category
		ORDER BY name ASC
	`);
}

categories.permissions = [
	'userId',
];

export default categories;
