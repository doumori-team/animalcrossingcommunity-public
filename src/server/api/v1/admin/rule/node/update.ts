import * as db from '@db';
import { constants } from '@utils';
import { APIThisType } from '@types';

/*
 * Update the rule's thread.
 */
async function update(this: APIThisType, { nodeId, content }: updateProps): Promise<void>
{
	// update thread with latest info
	const messageId = await db.transaction(async (query: db.QueryType) =>
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

	await db.updateThreadStats(nodeId);

	await this.query('v1/notification/create', { id: messageId, type: constants.notification.types.FT });
}

update.permissions = [
	'modify-rules-admin',
	'userId',
];

type updateProps = {
	nodeId: number
	content: string
};

export default update;
