import * as db from '@db';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, FollowedNodesType } from '@types';

/*
 * Get followed threads
 */
async function followed(this: APIThisType, { type, page }: followedProps): Promise<FollowedNodesType>
{
	const offset = page * constants.threadPageSize - constants.threadPageSize;

	// check permissions: users are granted node read access through user or group level
	// so check user level for thread and parent and check group for all of this user's
	// group for thread and parent

	const groupIds = await db.getUserGroups(this.userId);

	let orderBy = 'ORDER BY title ASC';

	if (type === 'thread')
	{
		orderBy = 'ORDER BY latest_reply_time DESC';
	}
	else if (type === 'post')
	{
		orderBy = 'ORDER BY creation_time DESC';
	}

	// you can't follow: PTs, All Public Threads board, Forums, Announcements, Shop Threads, Adoptee Threads
	// that means user node perms - used in PTs, Shops, Adoptions - isn't needed
	// User node perms is also used on GG Boards, but no one following boards or threads under that doesn't have access
	// would have to have access to follow something
	// we don't allow following posts in shops / adoptions, and posts in boards follow group
	// posts in PTs, use pts_user_read_granted
	const resultsQuery = db.query(`
		WITH followed_post_threads AS (
			SELECT DISTINCT parent_node_id
			FROM node
			JOIN followed_node ON followed_node.node_id = node.id
			WHERE followed_node.user_id = $3 AND node.type = 'post'
		),
		thread_posts AS (
			SELECT
				node.id AS node_id,
				ROW_NUMBER() OVER (
					PARTITION BY node.parent_node_id
					ORDER BY node.creation_time ASC
				) AS post_number,
				((ROW_NUMBER() OVER (
					PARTITION BY node.parent_node_id
					ORDER BY node.creation_time ASC
				) - 1) / $1) + 1 AS page_number
			FROM node
			JOIN followed_post_threads ON (followed_post_threads.parent_node_id = node.parent_node_id)
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
				(
					SELECT title
					FROM node_revision
					WHERE node_revision.node_id = node.id
					ORDER BY time DESC
					LIMIT 1
				) AS title,
				node.type,
				node.user_id,
				node.parent_node_id,
				parent.parent_node_id AS parent_node_id2,
				COALESCE(thread_posts.post_number, 0) AS post_number,
				COALESCE(thread_posts.page_number, 0) AS page_number,
				node.creation_time,
				node.locked,
				node.thread_type,
				node.latest_reply_time,
				node.reply_count,
				count(*) over() AS count
			FROM node
			LEFT JOIN node AS parent ON (parent.id = node.parent_node_id)
			JOIN followed_node ON (followed_node.node_id = node.id AND followed_node.user_id = $3)
			LEFT JOIN thread_posts ON (thread_posts.node_id = node.id)
			JOIN (
				SELECT DISTINCT ON (inner_node_id) *
				FROM (
					SELECT *
					FROM (
						SELECT
							'user' AS type,
							node.id AS inner_node_id,
							pts_user_read_granted.permission_user_id AS type_id,
							pts_user_read_granted.node_id,
							true AS granted,
							1 AS sequence
						FROM followed_node
						JOIN node ON (node.id = followed_node.node_id)
						JOIN pts_user_read_granted ON (node.parent_node_id = pts_user_read_granted.node_id)
						WHERE followed_node.user_id = $3 AND node.type = $4

						UNION ALL

						SELECT
							'group' AS type,
							user_group_node_permissions.id AS inner_node_id,
							user_group_node_permissions.type_id,
							user_group_node_permissions.node_id,
							user_group_node_permissions.granted,
							user_group_node_permissions.sequence
						FROM user_group_node_permissions
						JOIN followed_node ON (followed_node.node_id = user_group_node_permissions.id AND followed_node.user_id = $3)
						WHERE user_group_node_permissions.type = $4 AND user_group_node_permissions.user_group_id = ANY($6) AND user_group_node_permissions.node_permission_id = $5
					) AS permissions
					ORDER BY inner_node_id ASC, sequence ASC, type DESC, type_id DESC
				) AS permissions
			) AS permissions ON (permissions.inner_node_id = node.id AND permissions.granted = true)
			${orderBy}
			LIMIT $1::int OFFSET $2::int
		) AS nodes
		LEFT JOIN LATERAL (
			SELECT id, title, content, content_format
			FROM node_revision
			WHERE node_revision.node_id = nodes.id
			ORDER BY time DESC
			FETCH FIRST 1 ROW ONLY
		) last_revision ON true
	`, constants.threadPageSize, offset, this.userId, type, constants.nodePermissions.read, groupIds);

	const [count, childNodes] = await db.getChildren(resultsQuery, this.query, this.userId);

	return <FollowedNodesType>{
		results: childNodes,
		page: page,
		pageSize: constants.threadPageSize,
		totalCount: count,
		type: type,
	};
}

followed.permissions = [
	'userId',
];

followed.apiTypes = {
	type: {
		type: APITypes.string,
		default: 'board',
		includes: ['thread', 'board', 'post'],
		required: true,
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
};

type followedProps = {
	type: FollowedNodesType['type']
	page: number
};

export default followed;
