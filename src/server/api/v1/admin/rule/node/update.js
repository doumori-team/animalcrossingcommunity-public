import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';

/*
 * Update the rule's thread.
 */
export default async function update({nodeId, content})
{
	const permissionGranted = await this.query('v1/permission', {permission: 'modify-rules-admin'});

	if (!permissionGranted)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	// update thread with latest info
	const messageId = await db.transaction(async query =>
	{
		const [message] = await query(`
			INSERT INTO node (parent_node_id, user_id, type)
			VALUES ($1::int, $2::int, $3::node_type)
			RETURNING id
		`, nodeId, this.userId, 'post');

		await query(`
			INSERT INTO node_revision (node_id, reviser_id, content, content_format)
			VALUES ($1::int, $2::int, $3::text, $4::node_content_format)
		`, message.id, this.userId, content, 'markdown');

		return message.id;
	});

	await db.query(`
		UPDATE node
		SET latest_reply_time = (
			SELECT child.creation_time
			FROM node AS child
			WHERE child.parent_node_id = node.id
			ORDER BY child.creation_time DESC
			LIMIT 1
		)
		WHERE node.type = 'thread' AND node.id = $1
	`, nodeId);

	await this.query('v1/notification/create', {id: messageId, type: constants.notification.types.FT});
}