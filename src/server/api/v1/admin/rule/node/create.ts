import * as db from '@db';
import { UserError } from '@errors';
import { utils, constants } from '@utils';
import { APIThisType } from '@types';

/*
 * Create the thread + original message for rule.
 */
export default async function create(this: APIThisType, {ruleId, number, name, description, content}: createProps) : Promise<number>
{
	const permissionGranted:boolean = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	content = String(content || `A rule is being updated. Current rule is: ${description}`);

	const threadId = await db.transaction(async (query:any) =>
	{
		// create thread
		const [thread] = await query(`
			INSERT INTO node (parent_node_id, user_id, type)
			VALUES ($1::int, $2::int, $3::node_type)
			RETURNING id
		`, constants.boardIds.currentRules, this.userId, 'thread');

		const title = utils.ellipsisLongText(`${number} - ${name ? name : description}`);

		await query(`
			INSERT INTO node_revision (node_id, reviser_id, title)
			VALUES ($1::int, $2::int, $3::text)
		`, thread.id, this.userId, title);

		const [message] = await query(`
			INSERT INTO node (parent_node_id, user_id, type)
			VALUES ($1::int, $2::int, $3::node_type)
			RETURNING id
		`, thread.id, this.userId, 'post');

		await query(`
			INSERT INTO node_revision (node_id, reviser_id, content, content_format)
			VALUES ($1::int, $2::int, $3::text, $4::node_content_format)
		`, message.id, this.userId, content, 'markdown');

		return thread.id;
	});

	await this.query('v1/notification/create', {id: threadId, type: constants.notification.types.FB});

	await db.updateThreadStats(threadId);

	if (ruleId)
	{
		// update rule
		await db.query(`
			UPDATE rule
			SET node_id = $2::int
			WHERE id = $1::int
		`, ruleId, threadId);
	}

	return threadId;
}

type createProps = {
	ruleId: number
	number: number|string
	name: string
	description: string
	content: string
}