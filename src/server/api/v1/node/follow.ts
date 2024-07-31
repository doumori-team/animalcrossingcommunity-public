import * as db from '@db';
import { UserError } from '@errors';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NodeType, NodeLiteType } from '@types';

/*
 * Toggle following a thread or board.
 */
async function follow(this: APIThisType, {id}: followProps) : Promise<NodeType|null>
{
	const permission:boolean = await this.query('v1/node/permission', {permission: 'read', nodeId: id});

	if (!permission)
	{
		throw new UserError('permission');
	}

	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const node:NodeLiteType = await this.query('v1/node/lite', {id: id})

	if (!['board', 'thread'].includes(node.type) || [id, node.parentId].includes(constants.boardIds.privateThreads) || [id, node.parentId].includes(constants.boardIds.publicThreads) || [id].includes(constants.boardIds.accForums) || [id].includes(constants.boardIds.announcements) || [id, node.parentId].includes(constants.boardIds.shopThread) || [id, node.parentId].includes(constants.boardIds.adopteeThread))
	{
		// node/create will try to follow, just return null so it doesn't clog up logs
		return null;
	}

	const [followedNode] = await db.query(`
		SELECT node_id
		FROM followed_node
		WHERE node_id = $1::int AND user_id = $2::int
	`, id, this.userId);

	if (followedNode)
	{
		const types = constants.notification.types;

		await Promise.all([
			db.query(`
				DELETE FROM followed_node
				WHERE node_id = $1::int AND user_id = $2::int
			`, id, this.userId),
			this.query('v1/notification/destroy', {id: id, type: types.FT}),
			this.query('v1/notification/destroy', {id: id, type: types.FB}),
		]);
	}
	else
	{
		await db.query(`
			INSERT INTO followed_node (node_id, user_id) VALUES
			($1::int, $2::int)
		`, id, this.userId);
	}

	return await this.query('v1/node/full', {id: id});
}

follow.apiTypes = {
	id: {
		type: APITypes.nodeId,
		required: true,
	},
}

type followProps = {
	id: number,
}

export default follow;