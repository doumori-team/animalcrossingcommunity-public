import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';
import { APIThisType, FollowedNodesType, UserLiteType } from '@types';

/*
 * Get followed threads
 */
async function followed(this: APIThisType, { type, page }: followedProps): Promise<FollowedNodesType>
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user: UserLiteType = await this.query('v1/user_lite', { id: this.userId });

	const offset = page * constants.threadPageSize - constants.threadPageSize;

	// check permissions: users are granted node read access through user or group level
	// so check user level for thread and parent and check group for all of this user's
	// group for thread and parent

	const groupIds = await db.getUserGroups(this.userId);

	// you can't follow: posts, PTs, All Public Threads board, Forums, Announcements, Shop Threads, Adoptee Threads
	// that means user node perms - used in PTs, Shops, Adoptions - isn't needed
	// User node perms is also used on GG Boards, but no one following boards or threads under that doesn't have access
	// would have to have access to follow something
	const resultsQuery = db.query(`
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
				node.creation_time,
				node.locked,
				node.thread_type,
				node.latest_reply_time,
				node.reply_count,
				count(*) over() AS count
			FROM node
			JOIN followed_node ON (followed_node.node_id = node.id AND followed_node.user_id = $3)
			JOIN (
				SELECT DISTINCT ON (inner_node_id) *
				FROM (
					SELECT *
					FROM (
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
			ORDER BY ${type === 'board' ? 'title' : 'latest_reply_time'} ${type === 'board' ? 'ASC' : 'DESC'}
			LIMIT $1::int OFFSET $2::int
		) AS nodes
		LEFT JOIN LATERAL (
			SELECT id, title, content, content_format
			FROM node_revision
			WHERE node_revision.node_id = nodes.id
			ORDER BY time DESC
			FETCH FIRST 1 ROW ONLY
		) last_revision ON true
	`, constants.threadPageSize, offset, user.id, type, constants.nodePermissions.read, groupIds);

	const [count, childNodes] = await db.getChildren(resultsQuery, this.query, this.userId);

	return <FollowedNodesType>{
		results: childNodes,
		page: page,
		pageSize: constants.threadPageSize,
		totalCount: count,
		type: type,
	};
}

followed.apiTypes = {
	type: {
		type: APITypes.string,
		default: 'board',
		includes: ['thread', 'board'],
		required: true,
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
};

type followedProps = {
	type: 'thread' | 'board'
	page: number
};

export default followed;
