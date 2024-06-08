import * as db from '@db';
import { UserError } from '@errors';
import * as APITypes from '@apiTypes';
import { constants } from '@utils';

/*
 * Get followed threads
 */
async function followed({type, page})
{
	if (!this.userId)
	{
		throw new UserError('login-needed');
	}

	const user = await this.query('v1/user_lite', {id: this.userId});

	if (typeof(user) === 'undefined' || user.length === 0)
	{
		throw new UserError('no-such-user');
	}

	const pageSize = 25;
	const offset = (page * pageSize) - pageSize;

	// check permissions: users are granted node read access through user or group level
	// so check user level for thread and parent and check group for all of this user's
	// group for thread and parent

	const groupIds = await db.getUserGroups(this.userId);

	// you can't follow: posts, PTs, All Public Threads board, Forums, Announcements, Shop Threads, Adoptee Threads
	// that means user node perms - used in PTs, Shops, Adoptions - isn't needed
	// User node perms is also used on GG Boards, but no one following boards or threads under that doesn't have access
	// would have to have access to follow something
	const results = await db.query(`
		SELECT
			node.id,
			(
				SELECT title
				FROM node_revision
				WHERE node_revision.node_id = node.id
				ORDER BY time DESC
				LIMIT 1
			) AS title,
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
	`, pageSize, offset, user.id, type, constants.nodePermissions.read, groupIds);

	const nodes = await Promise.all(results.map(async(result) => {
		try
		{
			return await this.query('v1/node/full', {id: result.id});
		}
		catch (e)
		{
			// user doesn't have permission, ignore
			console.error(`v1/node/followed for ${this.userId}, error for node ${result.id}`);
			console.error(e);
		}
	}))

	return {
		results: nodes.map(n => n),
		page: page,
		pageSize: pageSize,
		totalCount: results.length > 0 ? Number(results[0].count) : 0,
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
}

export default followed;