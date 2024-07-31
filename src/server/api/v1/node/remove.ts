import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType } from '@types';

/*
 * Remove yourself from PTs.
 */
async function remove(this: APIThisType, {nodeIds}: removeProps) : Promise<void>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	nodeIds = await Promise.all(nodeIds.map(async (id) =>
	{
		const [node] = await db.query(`
			SELECT id, parent_node_id
			FROM node
			WHERE id = $1
		`, id);

		if (!node)
		{
			throw new UserError('no-such-node');
		}

		const permission:boolean = await this.query('v1/node/permission', {permission: 'read', nodeId: id});

		if (!permission)
		{
			throw new UserError('permission');
		}

		if (node.parent_node_id !== constants.boardIds.privateThreads)
		{
			throw new UserError('bad-format');
		}

		return Number(node.id);
	}));

	if (nodeIds.length === 0)
	{
		return;
	}

	await db.query(`
		UPDATE user_node_permission
		SET granted = false
		WHERE node_id = ANY($1) AND user_id = $2::int
	`, nodeIds, this.userId);

	await db.updatePTsLookupMass(nodeIds);
}

remove.apiTypes = {
	nodeIds: {
		type: APITypes.array,
		required: true,
	},
}

type removeProps = {
	nodeIds: any[]
}

export default remove;