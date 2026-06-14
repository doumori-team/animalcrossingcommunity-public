import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NodeType, NodeLiteType } from '@types';

async function notify(this: APIThisType, { id }: notifyProps): Promise<NodeType | null>
{
	const permission: boolean = await this.query('v1/node/permission', { permission: 'read', nodeId: id });

	if (!permission)
	{
		throw new UserError('permission');
	}

	const node: NodeLiteType = await this.query('v1/node/lite', { id: id });

	if (!['board', 'thread'].includes(node.type) || [id, node.parentId].includes(constants.boardIds.privateThreads) || [id, node.parentId].includes(constants.boardIds.publicThreads) || [id, node.parentId].includes(constants.boardIds.staffThreads) || [id].includes(constants.boardIds.accForums) || [id].includes(constants.boardIds.announcements) || [id, node.parentId].includes(constants.boardIds.shopThread) || [id, node.parentId].includes(constants.boardIds.adopteeThread))
	{
		throw new UserError('bad-format');
	}

	const [notifyNode] = await db.query(`
		SELECT node_id
		FROM notified_node
		WHERE node_id = $1::int AND user_id = $2::int
	`, id, this.userId);

	if (notifyNode)
	{
		const types = constants.notification.types;

		await Promise.all([
			db.query(`
				DELETE FROM notified_node
				WHERE node_id = $1::int AND user_id = $2::int
			`, id, this.userId),
			this.query('v1/notification/destroy', { id: id, type: types.FT }),
			this.query('v1/notification/destroy', { id: id, type: types.FB }),
		]);
	}
	else
	{
		await db.query(`
			INSERT INTO notified_node (node_id, user_id) VALUES
			($1::int, $2::int)
		`, id, this.userId);
	}

	return await this.query('v1/node/full', { id: id });
}

notify.permissions = [
	'userId',
];

notify.apiTypes = {
	id: {
		type: APITypes.nodeId,
		required: true,
	},
};

type notifyProps = {
	id: number,
};

export default notify;
