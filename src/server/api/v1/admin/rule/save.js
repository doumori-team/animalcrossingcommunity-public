import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';

async function save({id, number, name, description, categoryId, reportable})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	// Check parameters
	const category = await db.query(`
		SELECT id
		FROM rule_category
		WHERE id = $1::int
	`, categoryId);

	if (!category)
	{
		throw new UserError('bad-format');
	}

	// Perform queries
	if (id > 0)
	{
		const [rule] = await db.query(`
			SELECT start_date, node_id, description, name, number
			FROM rule
			WHERE rule.id = $1::int
		`, id);

		if (!rule)
		{
			throw new UserError('no-such-rule');
		}

		// Can't create another pending rule
		const [newRule] = await db.query(`
			SELECT id
			FROM rule
			WHERE rule.original_rule_id = $1::int
		`, id);

		if (newRule)
		{
			throw new UserError('invalid-rule-save');
		}

		let nodeId = rule.node_id;

		if (rule.start_date)
		{
			await db.query(`
				UPDATE rule
				SET pending_expiration = false
				WHERE id = $1::int
			`, id);

			if (!nodeId)
			{
				nodeId = await this.query('v1/admin/rule/node/create', {ruleId: id, number: rule.number, name: rule.name, description: rule.description});
			}

			await db.query(`
				INSERT INTO rule (number, name, description, original_rule_id, node_id, category_id, reportable)
				VALUES ($1::int, $2, $3, $4::int, $5::int, $6, $7)
			`, number, name, description, id, nodeId, categoryId, reportable);
		}
		else
		{
			await db.query(`
				UPDATE rule
				SET number = $2::int, name = $3, description = $4, category_id = $5, reportable = $6
				WHERE rule.id = $1::int
			`, id, number, name, description, categoryId, reportable);
		}

		// update thread with latest info
		await db.query(`
			UPDATE node_revision
			SET title = $2
			WHERE node_id = $1::int
		`, nodeId, `${number} - ${name ? name : description}`);

		await this.query('v1/admin/rule/node/update', {nodeId: nodeId, content: `The rule has been updated with the following description: ${description}`});
	}
	else
	{
		// create thread
		const nodeId = await this.query('v1/admin/rule/node/create', {number: number, name: name, description: description, content: `A rule has been made with the following description: ${description}`});

		// add rule
		await db.query(`
			INSERT INTO rule (number, name, description, node_id, category_id, reportable)
			VALUES ($1::int, $2, $3, $4::int, $5, $6)
		`, number, name, description, nodeId, categoryId, reportable);
	}
}

save.apiTypes = {
	id: {
		type: APITypes.ruleId,
		nullable: true,
	},
	number: {
		type: APITypes.number,
		required: true,
		min: 1,
		max: constants.max.ruleNumber,
	},
	name: {
		type: APITypes.string,
		nullable: true,
		error: 'missing-rule-name',
		length: constants.max.ruleName,
		profanity: true,
	},
	description: {
		type: APITypes.string,
		default: '',
		required: true,
		error: 'missing-rule-description',
		length: constants.max.ruleDescription,
		profanity: true,
	},
	categoryId: {
		type: APITypes.number,
		required: true,
	},
	reportable: {
		type: APITypes.boolean,
		default: true,
	},
}

export default save;