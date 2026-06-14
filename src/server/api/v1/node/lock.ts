import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType } from '@types';

/*
 * Mass lock PTs.
 */
async function lock(this: APIThisType, { nodeIds }: lockProps): Promise<void>
{
	nodeIds = await Promise.all((nodeIds as string[]).map(async id =>
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

		if (node.locked !== null)
		{
			throw new UserError('bad-format');
		}

		const permission: boolean = await this.query('v1/node/permission', { permission: 'lock', nodeId: id });

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

	await db.updatePTsLookupMass(nodeIds);
}

lock.permissions = [
	'userId',
];

lock.apiTypes = {
	nodeIds: {
		type: APITypes.array,
		required: true,
	},
};

type lockProps = {
	nodeIds: string[] | number[]
};

export default lock;
