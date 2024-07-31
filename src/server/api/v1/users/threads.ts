import * as db from '@db';
import { constants } from '@utils';
import * as APITypes from '@apiTypes';
import { UserError } from '@errors';
import { APIThisType, UserThreadsType } from '@types';

async function threads(this: APIThisType, {id, page}: threadsProps) : Promise<UserThreadsType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const offset = (page * constants.threadPageSize) - constants.threadPageSize;

	// check permissions: users are granted node read access through user or group level
	// so check user level for thread and parent and check group for all of this user's
	// group for thread and parent

	const [userGroups, viewUserGroups] = await Promise.all([
		db.getUserGroups(this.userId),
		db.getUserGroups(id),
	]);

	const resultsQuery = await db.query(`
		WITH RECURSIVE BOARDS as (
			SELECT n1.id, n1.parent_node_id, 1 AS level, n1.id AS root_id
			FROM node AS n1
			WHERE n1.type = 'board' AND n1.id != ALL($8)
			UNION ALL
			SELECT n2.id, n2.parent_node_id, p.level + 1, p.root_id
			FROM node n2
			JOIN boards p ON (p.parent_node_id = n2.id)
		)
		SELECT
			nodes.*,
			last_revision.id AS revision_id,
			last_revision.title,
			last_revision.content,
			last_revision.content_format
		FROM (
			SELECT
				node.id,
				node.type,
				node.user_id,
				node.parent_node_id,
				node.creation_time,
				node.locked,
				node.thread_type,
				node.latest_reply_time,
				node.reply_count,
				count(*) over() AS count
			FROM node
			JOIN (
				SELECT DISTINCT ON (inner_node_id) *
				FROM (
					SELECT *
					FROM (
						SELECT
							'user' AS type,
							pts_user_read_granted.node_id AS inner_node_id,
							pts_user_read_granted.permission_user_id AS type_id,
							true AS granted,
							1 AS sequence
						FROM pts_user_read_granted
						WHERE $7 = true AND $10 = false AND pts_user_read_granted.permission_user_id = $6 AND pts_user_read_granted.node_user_id = $3

						UNION ALL

						SELECT
							'user' AS type,
							node.id AS inner_node_id,
							$6 AS type_id,
							true AS granted,
							1 AS sequence
						FROM node
						WHERE $7 = true AND $10 = true AND node.user_id = $3 AND node.parent_node_id = $9

						UNION ALL

						SELECT
							'user' AS type,
							node.id AS inner_node_id,
							user_node_permission.user_id AS type_id,
							user_node_permission.granted,
							boards.level AS sequence
						FROM boards
						JOIN user_node_permission ON (user_node_permission.node_id = boards.id)
						JOIN node ON (boards.root_id = node.parent_node_id)
						WHERE node.type = 'thread' AND node.user_id = $3 AND user_node_permission.node_permission_id = $4 AND user_node_permission.user_id = $6

						UNION ALL

						SELECT
							'group' AS type,
							node.id AS inner_node_id,
							user_groups_ordered.level AS type_id,
							user_group_node_permission.granted,
							boards.level AS sequence
						FROM boards
						JOIN user_group_node_permission ON (user_group_node_permission.node_id = boards.id)
						JOIN user_groups_ordered ON (user_groups_ordered.id = user_group_node_permission.user_group_id)
						JOIN node ON (boards.root_id = node.parent_node_id)
						WHERE node.type = 'thread' AND node.user_id = $3 AND user_group_node_permission.user_group_id = ANY($5) AND user_group_node_permission.node_permission_id = $4
					) AS permissions
					ORDER BY inner_node_id ASC, sequence ASC, type DESC, type_id DESC
				) AS permissions
			) AS permissions ON (permissions.inner_node_id = node.id AND permissions.granted = true)
			ORDER BY node.latest_reply_time DESC
			LIMIT $1::int OFFSET $2::int
		) AS nodes
		LEFT JOIN LATERAL (
			SELECT id, title, content, content_format
			FROM node_revision
			WHERE node_revision.node_id = nodes.id
			ORDER BY time DESC
			FETCH FIRST 1 ROW ONLY
		) last_revision ON true
	`, constants.threadPageSize, offset, id, constants.nodePermissions.read, userGroups, this.userId, userGroups.includes(constants.userGroupIds.admin) || this.userId === id, [constants.boardIds.privateThreads, constants.boardIds.adopteeThread, constants.boardIds.shopThread], constants.boardIds.privateThreads, userGroups.includes(constants.userGroupIds.admin) && (!viewUserGroups.includes(constants.userGroupIds.admin) || this.userId === id));

	const [count, childNodes] = await db.getChildren(resultsQuery, this.query, this.userId);

	return <UserThreadsType>{
		results: childNodes,
		page: page,
		pageSize: constants.threadPageSize,
		totalCount: count,
	};
}

threads.apiTypes = {
	id: {
		type: APITypes.userId,
		required: true,
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
}

type threadsProps = {
	id: number
	page: number
}

export default threads;