import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function restore({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [ruleViolation] = await db.query(`
		SELECT rule_id, pending_expiration, severity_id, violation
		FROM rule_violation
		WHERE rule_violation.id = $1::int
	`, id);

	const [rule] = await db.query(`
		SELECT node_id
		FROM rule
		WHERE rule.id = $1::int
	`, ruleViolation.rule_id);

	if (!rule)
	{
		throw new UserError('no-such-rule');
	}

	// Can only restore pending expired violations
	if (!ruleViolation.pending_expiration)
	{
		throw new UserError('invalid-violation-restore');
	}

	// Perform queries
	await db.transaction(async query =>
	{
		await Promise.all([
			query(`
				UPDATE rule_violation
				SET pending_expiration = false
				WHERE id = $1::int
			`, id),
			query(`
				UPDATE rule
				SET pending_expiration = false
				WHERE id = $1::int
			`, ruleViolation.rule_id),
			this.query('v1/admin/rule/node/update', {
				nodeId: rule.node_id,
				content: `The rule violation has been restored: ${ruleViolation.severity_id} ${ruleViolation.violation}`,
			}),
		]);
	});
}

restore.apiTypes = {
	id: {
		type: APITypes.ruleViolationId,
	},
}

export default restore;