import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function expire({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [ruleViolation] = await db.query(`
		SELECT rule_id, start_date, severity_id, violation
		FROM rule_violation
		WHERE rule_violation.id = $1::int
	`, id);

	const [rule] = await db.query(`
		SELECT node_id, description, name, number
		FROM rule
		WHERE rule.id = $1::int
	`, ruleViolation.rule_id);

	if (!rule)
	{
		throw new UserError('no-such-rule');
	}

	// Can only expire current violations
	if (!ruleViolation.start_date)
	{
		throw new UserError('invalid-violation-expire');
	}

	// Perform queries
	await db.transaction(async query =>
	{
		let nodeId = rule.node_id;

		if (!nodeId)
		{
			nodeId = await this.query('v1/admin/rule/node/create', {ruleId: ruleViolation.rule_id, number: rule.number, name: rule.name, description: rule.description});
		}

		await Promise.all([
			query(`
				UPDATE rule_violation
				SET pending_expiration = true
				WHERE id = $1::int
			`, id),
			query(`
				DELETE FROM rule_violation
				WHERE original_violation_id = $1::int
			`, id),
			this.query('v1/admin/rule/node/update', {
				nodeId: nodeId,
				content: `The rule violation has been expired: ${ruleViolation.severity_id} ${ruleViolation.violation}`,
			}),
		]);
	});
}

expire.apiTypes = {
	id: {
		type: APITypes.ruleViolationId,
	},
}

export default expire;