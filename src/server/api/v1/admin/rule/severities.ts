import * as db from '@db';
import { APIThisType, SeverityType } from '@types';

async function severities(this: APIThisType): Promise<SeverityType[]>
{
	return await db.query(`
		SELECT
			rule_severity.id,
			rule_severity.name,
			rule_severity.description
		FROM rule_severity
		ORDER BY rule_severity.id ASC
	`);
}

severities.permissions = [
	'modify-rules-admin',
];

export default severities;
