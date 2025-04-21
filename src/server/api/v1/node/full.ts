import * as db from '@db';
import { UserError } from '@errors';
import { dateUtils, constants } from '@utils';
import * as APITypes from '@apiTypes';
import { APIThisType, NodeType } from '@types';

/*
 * Retrieves all properties of a specific node needed to display it.
 * See db.getChildren.
 */
async function full(this: APIThisType, { id, loadingNode = false }: fullProps): Promise<NodeType>
{
	const permission: boolean = await this.query('v1/node/permission', { permission: 'read', nodeId: id });

	if (!permission)
	{
		throw new UserError('permission');
	}

	const [[result], [revisions], editPerm, replyPerm, lockPerm, adminLockPerm,
		stickyPerm, movePerm, addUsersPerm, removeUsersPerm, users, [followedNode],
		[numFollowed], viewFollowersPerm, userSettings] = await Promise.all([
		db.query(`
			SELECT
				node.id,
				node.type,
				node.user_id,
				node.parent_node_id,
				node.creation_time,
				last_revision.id AS revision_id,
				last_revision.title,
				last_revision.content,
				last_revision.content_format,
				node.locked,
				node.thread_type,
				node.latest_reply_time,
				node.reply_count
			FROM node
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = node.id 
				ORDER BY time DESC
				LIMIT 1
			) last_revision ON true
			WHERE node.id = $1::int
		`, id),
		db.query(`
			SELECT count(*) AS count
			FROM node_revision
			WHERE node_id = $1::int
		`, id),
		this.query('v1/node/permission', { permission: 'edit', nodeId: id }),
		this.query('v1/node/permission', { permission: 'reply', nodeId: id }),
		this.query('v1/node/permission', { permission: 'lock', nodeId: id }),
		this.query('v1/node/permission', { permission: 'admin-lock', nodeId: id }),
		this.query('v1/node/permission', { permission: 'sticky', nodeId: id }),
		this.query('v1/node/permission', { permission: 'move', nodeId: id }),
		this.query('v1/node/permission', { permission: 'add-users', nodeId: id }),
		this.query('v1/node/permission', { permission: 'remove-users', nodeId: id }),
		db.query(`
			SELECT
				user_account_cache.id,
				user_account_cache.username,
				user_node_permission.granted,
				(
					SELECT last_checked
					FROM node_user
					WHERE node_user.node_id = user_node_permission.node_id AND node_user.user_id = user_account_cache.id
				) AS viewed
			FROM user_account_cache
			JOIN user_node_permission ON (user_node_permission.user_id = user_account_cache.id)
			WHERE user_node_permission.node_id = $1::int AND user_node_permission.node_permission_id = $2::int
			ORDER BY username ASC
		`, id, constants.nodePermissions.read),
		db.query(`
			SELECT node_id
			FROM followed_node
			WHERE node_id = $1::int AND user_id = $2::int
		`, id, this.userId),
		db.query(`
			SELECT count(*) AS count
			FROM followed_node
			WHERE node_id = $1::int
		`, id),
		this.query('v1/permission', { permission: 'view-followers' }),
		this.userId ? db.query(`
			SELECT markup_style, concise_mode, show_images
			FROM users
			WHERE id = $1
		`, this.userId) : null,
	]);

	if (!result)
	{
		throw new UserError('no-such-node');
	}

	if (result.locked && !this.userId)
	{
		throw new UserError('login-needed');
	}

	const conciseMode: number = userSettings && userSettings[0] ? Number(userSettings[0].concise_mode) : 2;

	const [parent, user, latestPage, latestPost, lastChecked, nodeFiles, unreadTotal] = await Promise.all([
		result.type === 'thread' ? this.query('v1/node/lite', { id: result.parent_node_id }) : null,
		result.user_id ? this.query('v1/user', { id: result.user_id }) : null,
		!loadingNode && result.type === 'thread' && this.userId ? db.getLatestPage(result.id, this.userId) : null,
		!loadingNode && result.type === 'thread' && this.userId ? db.getLatestPost(result.id, this.userId) : null,
		!loadingNode && result.type === 'thread' ? db.query(`
			SELECT last_checked
			FROM node_user
			WHERE node_id = $1 AND user_id = $2
		`, result.id, this.userId) : [],
		result.type === 'post' ? db.query(`
			SELECT file.id, file.file_id, file.name, file.width, file.height, file.caption
			FROM node_revision_file
			JOIN file ON (node_revision_file.file_id = file.id)
			WHERE node_revision_file.node_revision_id = $1::int
			ORDER BY file.sequence ASC
		`, result.revision_id) : null,
		!loadingNode && result.type === 'thread' && this.userId ? db.query(`
			SELECT
				(
					SELECT count(*) AS count
					FROM node
					WHERE node.parent_node_id = $1 AND node.creation_time > last_checked
				) AS count
			FROM (
				SELECT last_checked
				FROM node_user
				WHERE node_id = $1 AND user_id = $2
			) AS last_checked
		`, result.id, this.userId) : null,
		this.userId && result.type === 'thread' && loadingNode ? db.query(`
			INSERT INTO node_user (node_id, user_id)
			VALUES ($1, $2)
			ON CONFLICT (user_id, node_id) DO UPDATE SET last_checked = now()
		`, id, this.userId) : null,
	]);

	let permissions: string[] = [];

	if (editPerm)
	{
		permissions.push('edit');
	}

	if (replyPerm)
	{
		permissions.push('reply');
	}

	if (adminLockPerm)
	{
		permissions.push('admin-lock');
	}

	if (lockPerm)
	{
		permissions.push('lock');
	}

	if (stickyPerm)
	{
		permissions.push('sticky');
	}

	if (movePerm)
	{
		permissions.push('move');
	}

	if (addUsersPerm)
	{
		permissions.push('add-users');
	}

	if (removeUsersPerm)
	{
		permissions.push('remove-users');
	}

	const returnLatestPost: number = latestPost && latestPost[0] ? latestPost[0].latest_post : 0;

	const replies: number = result.reply_count ? Number(result.reply_count) - 1 : 0;

	const returnVal = <NodeType>{
		id: result.id,
		type: result.type,
		parentId: result.parent_node_id,
		revisionId: result.revision_id,
		title: result.title,
		created: result.creation_time,
		formattedCreated: dateUtils.formatDateTime(result.creation_time),
		locked: result.locked,
		threadType: result.thread_type,
		edits: revisions - 1,
		followed: followedNode ? true : false,
		numFollowed: viewFollowersPerm ? Number(numFollowed.count) : 0,
		board: parent ? parent.title : '',
		permissions,
		replyCount: replies,
		latestPage: latestPage && latestPage[0] ? latestPage[0].latest_page : null,
		latestPost: returnLatestPost,
		unread: this.userId && result.type === 'thread' ? lastChecked.length > 0 ? returnLatestPost > 0 ? true : false : result.locked ? false : true : false,
		unreadTotal: unreadTotal ? unreadTotal[0] ? Number(unreadTotal[0].count) : replies + 1 : null,
		markupStyle: userSettings ? userSettings[0].markup_style : null,
		files: nodeFiles ? nodeFiles.map((file: any) =>
		{
			return {
				id: file.id,
				fileId: file.file_id,
				name: file.name,
				width: file.width,
				height: file.height,
				caption: file.caption,
			};
		}) : [],
		conciseMode: conciseMode,
		content: null,
		users: users,
		showImages: userSettings ? userSettings[0].show_images : false,
	};

	if (result.user_id)
	{
		returnVal.user = user;
	}

	if (result.content)
	{
		returnVal.content = {
			text: result.content,
			format: result.content_format,
		};
	}

	if (result.latest_reply_time)
	{
		returnVal.lastReply = dateUtils.formatDateTime(result.latest_reply_time);
	}

	if (loadingNode)
	{
		const types = constants.notification.types;

		if (returnVal.type === 'thread')
		{
			if (returnVal.parentId === constants.boardIds.privateThreads)
			{
				await this.query('v1/notification/destroy', { id: returnVal.id, type: types.PT });
			}
			else if (returnVal.parentId === constants.boardIds.adopteeThread)
			{
				await Promise.all([
					this.query('v1/notification/destroy', { id: returnVal.id, type: types.scoutAdoption }),
					this.query('v1/notification/destroy', { id: returnVal.id, type: types.scoutThread }),
				]);
			}
			else if (returnVal.parentId === constants.boardIds.adopteeBT)
			{
				await this.query('v1/notification/destroy', { id: returnVal.id, type: types.scoutBT });
			}
			else if (returnVal.parentId === constants.boardIds.announcements)
			{
				await this.query('v1/notification/destroy', { id: returnVal.id, type: types.announcement });
			}
			else if (returnVal.parentId === constants.boardIds.shopThread)
			{
				await this.query('v1/notification/destroy', { id: returnVal.id, type: types.shopThread });
			}
			else
			{
				await this.query('v1/notification/destroy', { id: returnVal.id, type: types.FT });
			}

			await this.query('v1/notification/destroy', { id: returnVal.id, type: types.usernameTag });
			await this.query('v1/notification/destroy', { id: returnVal.parentId, type: types.FB });
		}
		else if (returnVal.type === 'board')
		{
			await this.query('v1/notification/destroy', { id: returnVal.id, type: types.FB });
		}
	}

	return returnVal;
}

full.apiTypes = {
	id: {
		type: APITypes.number,
		required: true,
	},
	// loadingNode not checked on purpose
};

type fullProps = {
	id: number,
	loadingNode: boolean
};

export default full;
