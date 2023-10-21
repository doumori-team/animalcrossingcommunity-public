import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

async function destroy({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [ruleViolation] = await db.query(`
		SELECT start_date, rule_id, severity_id, violation
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

	// Can only delete new / pending rules
	if (ruleViolation.start_date)
	{
		throw new UserError('invalid-violation-delete');
	}

	await Promise.all([
		db.query(`
			DELETE FROM rule_violation
			WHERE id = $1::int
		`, id),
		this.query('v1/admin/rule/node/update', {
			nodeId: rule.node_id,
			content: `The rule violation has been reverted: ${ruleViolation.severity_id} ${ruleViolation.violation}`,
		}),
	]);
}

destroy.apiTypes = {
	id: {
		type: APITypes.ruleViolationId,
	},
}

export default destroy;