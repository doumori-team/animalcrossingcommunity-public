import * as db from '@db';
import { UserError } from '@errors';

export default async function categories()
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	return await db.cacheQuery('v1/feature/categories', `
		SELECT
			feature_category.id,
			feature_category.name
		FROM feature_category
		ORDER BY name ASC
	`);
}