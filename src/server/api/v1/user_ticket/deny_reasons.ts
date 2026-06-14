import * as db from '@db';
import { APIThisType, DenyReasonType } from '@types';

async function deny_reasons(this: APIThisType): Promise<DenyReasonType[]>
{
	return await db.query(`
		SELECT
			id,
			name,
			active
		FROM user_ticket_deny_reason
		ORDER BY id ASC
	`);
}

deny_reasons.permissions = [
	'process-user-tickets',
];

export default deny_reasons;
