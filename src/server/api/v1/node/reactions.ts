import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { APIThisType, NodeLiteType, NodeReactionType } from '@types';

async function reactions(this: APIThisType, { id }: reactionsProps): Promise<NodeReactionType[]>
{
	const permission: boolean = await this.query('v1/node/permission', { permission: 'read', nodeId: id });

	if (!permission)
	{
		throw new UserError('permission');
	}

	const node: NodeLiteType = await this.query('v1/node/lite', { id: id });

	if (node.type !== 'post')
	{
		throw new UserError('bad-format');
	}

	const nodeEmojiUsers = await db.query(`
		SELECT node_reaction.emoji, node_reaction.user_id, user_account_cache.username
		FROM node_reaction
		JOIN user_account_cache ON (user_account_cache.id = node_reaction.user_id)
		WHERE node_reaction.node_id = $1
		ORDER BY node_reaction.reacted ASC
	`, id);

	return Object.values(
		nodeEmojiUsers.reduce((acc, { user_id, emoji, username }) =>
		{
			if (!acc[emoji])
			{
				acc[emoji] = { emoji, src: emoji, users: [] };
			}

			acc[emoji].users.push({ userId: user_id, username });

			return acc;
		}, {}),
	);
}

reactions.apiTypes = {
	id: {
		type: APITypes.nodeId,
		required: true,
	},
};

type reactionsProps = {
	id: number
};

export default reactions;
