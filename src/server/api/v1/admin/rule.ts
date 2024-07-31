import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, RuleType } from '@types';

async function rule(this: APIThisType, {id}: ruleProps) : Promise<RuleType>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	const [rule] = await db.query(`
		SELECT
			rule.id,
			rule.number,
			rule.name,
			rule.description,
			rule.category_id,
			rule.reportable
		FROM rule
		WHERE rule.id = $1::int
	`, id);

	if (!rule)
	{
		throw new UserError('no-such-rule');
	}

	return <RuleType>{
		id: rule.id,
		number: rule.number,
		name: rule.name,
		description: rule.description,
		categoryId: rule.category_id,
		reportable: rule.reportable,
	};
}

rule.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
}

type ruleProps = {
	id: number
}

export default rule;