import * as db from '@db';
import { UserError } from '@errors';

export default async function severities()
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	return await db.query(`
		SELECT
			rule_severity.id,
			rule_severity.name,
			rule_severity.description
		FROM rule_severity
		ORDER BY rule_severity.id ASC
	`);
}