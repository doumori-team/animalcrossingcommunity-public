import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function restore(this: APIThisType, {id}: restoreProps) : Promise<void>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [rule] = await db.query(`
		SELECT pending_expiration, node_id
		FROM rule
		WHERE rule.id = $1::int
	`, id);

	// Can only restore pending expired rules
	if (!rule.pending_expiration)
	{
		throw new UserError('invalid-rule-restore');
	}

	await db.transaction(async (query:any) =>
	{
		await Promise.all([
			query(`
				UPDATE rule
				SET pending_expiration = false
				WHERE id = $1::int
			`, id),
			query(`
				UPDATE rule_violation
				SET pending_expiration = false
				WHERE rule_id = $1::int
			`, id),
			rule.node_id ? query(`
				UPDATE node
				SET locked = null
				WHERE id = $1::int
			`, rule.node_id) : null,
		]);
	});
}

restore.apiTypes = {
	id: {
		type: APITypes.ruleId,
		required: true,
	},
}

type restoreProps = {
	id: number
}

export default restore;