import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

async function destroy(this: APIThisType, { id }: destroyProps): Promise<void>
{
	const permissionGranted: boolean = await this.query('v1/permission', { permission: 'modify-rules-admin' });

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [rule] = await db.query(`
		SELECT start_date, node_id
		FROM rule
		WHERE rule.id = $1::int
	`, id);

	// Can only delete new / pending rules
	if (rule.start_date)
	{
		throw new UserError('invalid-rule-delete');
	}

	await db.transaction(async (query: any) =>
	{
		await Promise.all([
			query(`
				DELETE FROM rule
				WHERE id = $1::int
			`, id),
			query(`
				DELETE FROM rule_violation
				WHERE rule_id = $1::int
			`, id),
			rule.node_id ? query(`
				UPDATE node
				SET locked = NOW(), thread_type = 'normal'
				WHERE id = $1::int
			`, rule.node_id) : null,
		]);
	});
}

destroy.apiTypes = {
	id: {
		type: APITypes.ruleId,
		required: true,
	},
};

type destroyProps = {
	id: number
};

export default destroy;
