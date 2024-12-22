import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, ViolationType } from '@types';

async function violation(this: APIThisType, { id }: violationProps): Promise<ViolationType>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-rules-admin' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [violation] = await db.query(`
		SELECT
			rule_violation.id,
			rule_violation.number,
			rule_violation.severity_id,
			rule_violation.violation
		FROM rule_violation
		WHERE rule_violation.id = $1::int
	`, id);

	if (!violation)
	{
		throw new UserError('no-such-violation');
	}

	return <ViolationType>{
		id: violation.id,
		number: violation.number,
		severityId: violation.severity_id,
		violation: violation.violation,
	};
}

violation.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type violationProps = {
	id: number
};

export default violation;
