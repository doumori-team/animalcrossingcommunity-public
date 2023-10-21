import * as db from '@db';
import { constants } from '@utils';
import { UserError } from '@errors';

export default async function boards({nodeIds})
{
	// Check params
	if (!Array.isArray(nodeIds))
	{
		if (nodeIds)
		{
			nodeIds = nodeIds.split(',');
		}
		else
		{
			nodeIds = [];
		}
	}

	nodeIds = await Promise.all(nodeIds.map(async (nodeId) =>
	{
		const [check] = await db.query(`
			SELECT id
			FROM node
			WHERE id = $1::int
		`, nodeId);

		if (!check)
		{
			throw new UserError('no-such-node');
		}

		return Number(check.id);
	}));

	const groupIds = await this.query('v1/users/user_groups');
	let boards = [];

	if (nodeIds.length > 0)
	{
		boards = await db.query(`
			SELECT
				node.id,
				node.type,
				node.parent_node_id,
				last_revision.title,
				last_revision.content,
				last_revision.content_format,
				CASE WHEN EXISTS (
					SELECT followed_node.node_id
					FROM followed_node
					WHERE followed_node.node_id = node.id AND user_id = $3
				) THEN 1 ELSE 0 END AS followed
			FROM node
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = node.id
				ORDER BY time DESC
				FETCH FIRST 1 ROW ONLY
			) last_revision ON true
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
						WHERE user_node_permissions.type = 'board' AND user_node_permissions.type_id = $3 AND user_node_permissions.node_permission_id = $4 AND user_node_permissions.parent_node_id = ANY($1)

						UNION ALL

						SELECT
							'group' AS type,
							user_group_node_permissions.id AS inner_node_id,
							user_group_node_permissions.type_id,
							user_group_node_permissions.node_id,
							user_group_node_permissions.granted,
							user_group_node_permissions.sequence
						FROM user_group_node_permissions
						WHERE user_group_node_permissions.type = 'board' AND user_group_node_permissions.user_group_id = ANY($2) AND user_group_node_permissions.node_permission_id = $4 AND user_group_node_permissions.parent_node_id = ANY($1)
					) AS permissions
					ORDER BY inner_node_id ASC, sequence ASC, type DESC, type_id DESC
				) AS permissions
			) AS permissions ON (permissions.inner_node_id = node.id AND permissions.granted = true)
			ORDER BY last_revision.title ASC
		`, nodeIds, groupIds, this.userId, constants.nodePermissions.read);
	}
	else
	{
		boards = await db.query(`
			SELECT
				node.id,
				node.type,
				node.parent_node_id,
				last_revision.title,
				last_revision.content,
				last_revision.content_format,
				0 AS followed
			FROM node
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = node.id
				ORDER BY time DESC
				FETCH FIRST 1 ROW ONLY
			) last_revision ON true
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
						WHERE user_node_permissions.type = 'board' AND user_node_permissions.type_id = $2 AND user_node_permissions.node_permission_id = $3

						UNION ALL

						SELECT
							'group' AS type,
							user_group_node_permissions.id AS inner_node_id,
							user_group_node_permissions.type_id,
							user_group_node_permissions.node_id,
							user_group_node_permissions.granted,
							user_group_node_permissions.sequence
						FROM user_group_node_permissions
						WHERE user_group_node_permissions.type = 'board' AND user_group_node_permissions.user_group_id = ANY($1) AND user_group_node_permissions.node_permission_id = $3
					) AS permissions
					ORDER BY inner_node_id ASC, sequence ASC, type DESC, type_id DESC
				) AS permissions
			) AS permissions ON (permissions.inner_node_id = node.id AND permissions.granted = true)
			ORDER BY last_revision.title ASC
		`, groupIds, this.userId, constants.nodePermissions.read);
	}

	return boards.map(board => {
		return {
			id: board.id,
			type: board.type,
			parentId: board.parent_node_id,
			title: board.title,
			content: {
				text: board.content,
				format: board.content_format,
			},
			followed: board.followed ? true : false,
		};
	});
}