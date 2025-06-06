import * as db from '@db';
import { constants } from '@utils';
import { UserError } from '@errors';
import { APIThisType, NodeBoardType } from '@types';

export default async function boards(this: APIThisType, { nodeIds }: { nodeIds?: number[] }): Promise<NodeBoardType[]>
{
	// Check params
	if (Array.isArray(nodeIds))
	{
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
	}

	const groupIds = await db.getUserGroups(this.userId);
	let boards = [];

	if (Array.isArray(nodeIds) && nodeIds.length > 0)
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
				) THEN 1 ELSE 0 END AS followed,
				node.board_type,
				fc.forum_category
			FROM node
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = node.id
				ORDER BY time DESC
				FETCH FIRST 1 ROW ONLY
			) last_revision ON true
			LEFT JOIN (
				SELECT ncl.node_id,
				json_build_object(
					'id', nc.id,
					'title', nc.title,
					'order', ncl.order
		 		) forum_category
				FROM node_category nc
				INNER JOIN node_category_link ncl ON nc.id = ncl.category_id
			) fc ON fc.node_id = node.id
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
				0 AS followed,
				node.board_type,
				fc.forum_category
			FROM node
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = node.id
				ORDER BY time DESC
				FETCH FIRST 1 ROW ONLY
			) last_revision ON true
			LEFT JOIN (
				SELECT ncl.node_id,
				json_build_object(
					'id', nc.id,
					'title', nc.title,
					'order', ncl.order
		 		) forum_category
				FROM node_category nc
				INNER JOIN node_category_link ncl ON nc.id = ncl.category_id
			) fc ON fc.node_id = node.id
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

	return boards.map((board: any) =>
	{
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
			boardType: board.board_type,
			forumCategory: board.forum_category,
		};
	});
}
