import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function save(this: APIThisType, { id, ruleId, severityId, number, violation }: saveProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-rules-admin' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [rule] = await db.query(`
		SELECT node_id, description, name, number
		FROM rule
		WHERE id = $1::int
	`, ruleId);

	let nodeId = rule.node_id;

	if (!nodeId)
	{
		nodeId = await this.query('v1/admin/rule/node/create', { ruleId: ruleId, number: rule.number, name: rule.name, description: rule.description });
	}

	if (severityId)
	{
		const [severity] = await db.query(`
			SELECT id
			FROM rule_severity
			WHERE id = $1::int
		`, severityId);

		if (!severity)
		{
			throw new UserError('missing-severity');
		}
	}

	// Perform queries
	let content = violation;

	if (severityId)
	{
		content = `${severityId} ${violation}`;
	}

	await db.transaction(async (query: any) =>
	{
		if (id > 0)
		{
			const [ruleViolation] = await query(`
				SELECT start_date, severity_id, violation
				FROM rule_violation
				WHERE rule_violation.id = $1::int
			`, id);

			if (!ruleViolation)
			{
				throw new UserError('no-such-violation');
			}

			// Can't create another pending violation
			const [newViolation] = await query(`
				SELECT id
				FROM rule_violation
				WHERE rule_violation.original_violation_id = $1::int
			`, id);

			if (newViolation)
			{
				throw new UserError('invalid-validation-save');
			}

			if (ruleViolation.start_date)
			{
				await Promise.all([
					query(`
						UPDATE rule_violation
						SET pending_expiration = false
						WHERE id = $1::int
					`, id),
					this.query('v1/admin/rule/node/update', {
						nodeId: nodeId,
						content: `A rule violation is being updated. Current rule violation is: ${ruleViolation.severity_id} ${ruleViolation.violation}`,
					}),
					query(`
						INSERT INTO rule_violation (rule_id, severity_id, number, violation, original_violation_id)
						VALUES ($1::int, $2::int, $3::int, $4, $5::int)
					`, ruleId, severityId, number, violation, id),
				]);
			}
			else
			{
				await query(`
					UPDATE rule_violation
					SET severity_id = $2::int, number = $3::int, violation = $4
					WHERE rule_violation.id = $1::int
				`, id, severityId, number, violation);
			}

			// update thread with latest info
			await this.query('v1/admin/rule/node/update', { nodeId: nodeId, content: `The rule violation has been updated with the following: ${content}` });
		}
		else
		{
			await Promise.all([
				query(`
					INSERT INTO rule_violation (rule_id, severity_id, number, violation)
					VALUES ($1::int, $2::int, $3::int, $4)
				`, ruleId, severityId, number, violation),
				this.query('v1/admin/rule/node/update', {
					nodeId: nodeId,
					content: `The rule violation has been added with the following: ${content}`,
				}),
			]);
		}
	});
}

save.apiTypes = {
	id: {
		type: APITypes.ruleViolationId,
		nullable: true,
	},
	ruleId: {
		type: APITypes.ruleId,
		required: true,
	},
	severityId: {
		type: APITypes.number,
		nullable: true,
		error: 'missing-severity',
	},
	number: {
		type: APITypes.number,
		required: true,
		min: 1,
		max: constants.max.ruleViolationNumber,
	},
	violation: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-violation',
		length: constants.max.ruleViolation,
	},
};

type saveProps = {
	id: number
	ruleId: number
	severityId: number | null
	number: number
	violation: string
};

export default save;
