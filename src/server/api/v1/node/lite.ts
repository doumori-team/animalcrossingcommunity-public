import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, NodeLiteType } from '@types';

/*
 * Retrieves the most important properties of a specific node.
 */
async function lite(this: APIThisType, { id }: liteProps): Promise<NodeLiteType>
{
	const permission: boolean = await this.query('v1/node/permission', { permission: 'read', nodeId: id });

	if (!permission)
	{
		throw new UserError('permission');
	}

	const [node] = await db.query(`
		SELECT
			node.id,
			node.type,
			node.parent_node_id,
			parent.parent_node_id AS parent_node_id2,
			(
				SELECT title
				FROM node_revision
				WHERE node_revision.node_id = node.id 
				ORDER BY time DESC
				LIMIT 1
			) AS title,
			node.locked,
			node.thread_type,
			node.user_id
		FROM node
		LEFT JOIN node AS parent ON (parent.id = node.parent_node_id)
		WHERE node.id = $1::int
	`, id);

	if (!node)
	{
		throw new UserError('no-such-node');
	}

	return <NodeLiteType>{
		id: node.id,
		type: node.type,
		parentId: node.parent_node_id,
		parentId2: node.parent_node_id2,
		title: node.title,
		locked: node.locked,
		threadType: node.thread_type,
		userId: node.user_id,
	};
}

lite.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
};

type liteProps = {
	id: number
};

export default lite;
