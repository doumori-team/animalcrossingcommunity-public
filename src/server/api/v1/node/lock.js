import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';

/*
 * Mass lock PTs.
 */
async function lock({nodeIds})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	nodeIds = await Promise.all(nodeIds.map(async (id) =>
	{
		const [node] = await db.query(`
			SELECT id, locked
			FROM node
			WHERE id = $1
		`, id);

		if (!node)
		{
			throw new UserError('no-such-node');
		}

		if (node.locked != null)
		{
			throw new UserError('bad-format');
		}

		const permission = await this.query('v1/node/permission', {permission: 'lock', nodeId: id});

		if (!permission)
		{
			throw new UserError('permission');
		}

		return Number(node.id);
	}));

	if (nodeIds.length === 0)
	{
		return;
	}

	await db.query(`
		UPDATE node
		SET locked = now(), thread_type = 'normal'
		WHERE id = ANY($1)
	`, nodeIds);
}

lock.apiTypes = {
	nodeIds: {
		type: APITypes.array,
	},
}

export default lock;