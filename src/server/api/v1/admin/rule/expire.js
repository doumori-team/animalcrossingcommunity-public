import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

/*
 * Indicates a rule is going to expire.
 */
async function expire({id})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [rule] = await db.query(`
		SELECT start_date, node_id
		FROM rule
		WHERE rule.id = $1::int
	`, id);

	// Can only expire current rules
	if (!rule.start_date)
	{
		throw new UserError('invalid-rule-expire');
	}

	// Perform queries
	await db.transaction(async query =>
	{
		await query(`
			UPDATE rule
			SET pending_expiration = true
			WHERE id = $1::int
		`, id);

		await query(`
			UPDATE rule_violation
			SET pending_expiration = true
			WHERE rule_id = $1::int
		`, id);

		await query(`
			DELETE FROM rule_violation
			WHERE rule_violation.rule_id IN (SELECT id FROM rule WHERE original_rule_id = $1::int)
		`, id);

		await query(`
			DELETE FROM rule
			WHERE original_rule_id = $1::int
		`, id);

		if (rule.node_id)
		{
			await query(`
				UPDATE node
				SET locked = NOW(), thread_type = 'normal'
				WHERE id = $1::int
			`, rule.node_id);
		}
	});
}

expire.apiTypes = {
	id: {
		type: APITypes.ruleId,
	},
}

export default expire;