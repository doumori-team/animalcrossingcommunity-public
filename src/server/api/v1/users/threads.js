import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';

async function threads({id, page})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;

	// check permissions: users are granted node read access through user or group level
	// so check user level for thread and parent and check group for all of this user's
	// group for thread and parent

	const [userGroups, viewUserGroups] = await Promise.all([
		this.query('v1/users/user_groups'),
		this.query('v1/users/user_groups', {userId: id}),
	]);

	const results = await db.query(`
		SELECT
			node.id,
			count(*) over() AS count
		FROM node
		JOIN (
			SELECT DISTINCT ON (inner_node_id) *
			FROM (
				SELECT *
				FROM (
					SELECT
						'user' AS type,
						user_node_permissions.id AS inner_node_id,
						user_node_permissions.type_id,
						user_node_permissions.node_id,
						user_node_permissions.granted,
						user_node_permissions.sequence
					FROM user_node_permissions
					WHERE user_node_permissions.type = 'thread' AND user_node_permissions.type_id = $6 AND user_node_permissions.node_permission_id = $4 AND user_node_permissions.user_id = $3 AND ($8 = true OR ($8 != true AND user_node_permissions.parent_node_id != $7))

					UNION ALL

					SELECT
						'group' AS type,
						user_group_node_permissions.id AS inner_node_id,
						user_group_node_permissions.type_id,
						user_group_node_permissions.node_id,
						user_group_node_permissions.granted,
						user_group_node_permissions.sequence
					FROM user_group_node_permissions
					WHERE user_group_node_permissions.type = 'thread' AND user_group_node_permissions.user_group_id = ANY($5) AND user_group_node_permissions.node_permission_id = $4 AND user_group_node_permissions.user_id = $3 AND ($8 = true OR ($8 != true AND user_group_node_permissions.parent_node_id != $7))
				) AS permissions
				ORDER BY inner_node_id ASC, sequence ASC, type DESC, type_id DESC
			) AS permissions
		) AS permissions ON (permissions.inner_node_id = node.id AND permissions.granted = true)
		ORDER BY node.latest_reply_time DESC
		LIMIT $1::int OFFSET $2::int
	`, pageSize, offset, id, constants.nodePermissions.read, userGroups, this.userId, constants.boardIds.privateThreads, (userGroups.includes(constants.userGroupIds.admin) && !viewUserGroups.includes(constants.userGroupIds.admin)) || this.userId === id);

	const nodes = await Promise.all(results.map(async(result) => {
		try
		{
			return await this.query('v1/node/full', {id: result.id});
		}
		catch (e)
		{
			// user doesn't have permission, ignore
			console.error(`v1/threads for ${id} by ${this.userId}, error for node ${result.id}`);
			console.error(e);
		}
	}))

	return {
		results: nodes.map(n => n),
		page: page,
		pageSize: pageSize,
		totalCount: results.length > 0 ? Number(results[0].count) : 0,
	};
}

threads.apiTypes = {
	id: {
		type: APITypes.userId,
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
}

export default threads;