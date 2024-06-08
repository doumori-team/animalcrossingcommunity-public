import * as db from '@db';
import { UserError } from '@errors';

export default async function statuses()
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	return await db.cacheQuery('v1/feature/statuses', `
		SELECT
			feature_status.id,
			feature_status.name,
			feature_status.description,
			feature_status.sequence
		FROM feature_status
		ORDER BY feature_status.sequence ASC
	`);
}