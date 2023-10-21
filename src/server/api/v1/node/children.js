import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';

async function children({id, order, reverse, page, showLocked})
{
	const [permission, [node], groupIds, ggBoardPerm, viewPTs, userSettings] = await Promise.all([
		this.query('v1/node/permission', {permission: 'read', nodeId: id}),
		db.query('SELECT id, type, parent_node_id FROM node WHERE id = $1::int', id),
		this.query('v1/users/user_groups'),
		this.userId && id === constants.boardIds.accForums ? this.query('v1/node/permission', {
			permission: 'read',
			nodeId: constants.boardIds.ggBoard
		}) : null,
		this.query('v1/permission', {permission: 'view-other-private-threads'}),
		this.userId ? db.query(`
			SELECT show_images, concise_mode
			FROM users
			WHERE id = $1::int
		`, this.userId) : null,
	]);

	if (!permission)
	{
		throw new UserError('permission');
	}

	if (node.type === 'thread')
	{
		order = 'creation_time';
		reverse = false;
	}

	// logic that auto grants access to user to age-locked GG Boards
	if (this.userId && id === constants.boardIds.accForums && !ggBoardPerm)
	{
		const modifyBoardAgePerm = await this.query('v1/permission', {permission: 'allow-age-board'});

		if (modifyBoardAgePerm)
		{
			try
			{
				const birthdate = await accounts.getBirthDate(this.userId);
				const age = dateUtils.getAge(birthdate);

				if (age >= constants.ggBoardAge)
				{
					await db.query(`
						DELETE FROM user_node_permission
						WHERE user_id = $1 AND node_id = $2 AND node_permission_id = $3 AND granted = false
					`, this.userId, constants.boardIds.ggBoard, constants.nodePermissions.read);
				}
			}
			catch (error)
			{
				console.error(`Error updating GG Board Access for User ${this.userId}:`);
				console.error(error);
			}
		}
	}

	const pageSize = node.type === 'board' ? 50 : constants.threadPageSize;
	const offset = (page * pageSize) - pageSize;

	let resultsQuery = null;

	if (id === constants.boardIds.privateThreads)
	{
		resultsQuery = db.query(`
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
				count(*) over() AS count
			FROM node
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = node.id
				ORDER BY time DESC
				FETCH FIRST 1 ROW ONLY
			) last_revision ON true
			JOIN user_node_permission ON (user_node_permission.node_id = node.id)
			WHERE node.type = 'thread' AND node.parent_node_id = $1 AND user_node_permission.user_id = $6 AND user_node_permission.node_permission_id = $5 AND user_node_permission.granted = true AND
				($4 = true OR ($4 = false AND node.locked IS NULL))
			ORDER BY thread_type desc, ${order} ${reverse ? 'DESC' : ''}
			LIMIT $2 OFFSET $3
		`, id, pageSize, offset, showLocked, constants.nodePermissions.read, this.userId);
	}
	// We don't look at permissions here to make it faster,
	// not because it's impossible for a user / user group to be given board permissions
	// if a user / group is denied access, it's silly because they can log out and view the board
	// and this is all about VIEWING, not reply or edit or any of that
	// so you can still prevent them from replying
	// if a group is denied access, it should be removed from the constant
	else if (constants.allPublicBoards.includes(id) || id === constants.boardIds.publicThreads)
	{
		// for launch, to make reading forums easier
		// basically if it's a public board, just allow it
		if (id === constants.boardIds.publicThreads)
		{
			resultsQuery = db.query(`
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
					count(*) over() AS count
				FROM node
				LEFT JOIN LATERAL (
					SELECT id, title, content, content_format
					FROM node_revision
					WHERE node_revision.node_id = node.id
					ORDER BY time DESC
					FETCH FIRST 1 ROW ONLY
				) last_revision ON true
				WHERE node.parent_node_id = ANY($3) AND node.type = 'thread' AND latest_reply_time > now() - interval '30' day AND node.locked IS NULL
				ORDER BY latest_reply_time DESC
				LIMIT $1::int OFFSET $2::int
			`, pageSize, offset, constants.allPublicBoards);
		}
		else
		{
			resultsQuery = db.query(`
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
					count(*) over() AS count
				FROM node
				LEFT JOIN LATERAL (
					SELECT id, title, content, content_format
					FROM node_revision
					WHERE node_revision.node_id = node.id
					ORDER BY time DESC
					FETCH FIRST 1 ROW ONLY
				) last_revision ON true
				WHERE node.parent_node_id = $3 AND node.type = 'thread' AND
					($4 = true OR ($4 = false AND node.locked IS NULL))
				ORDER BY thread_type desc, ${order} ${reverse ? 'DESC' : ''}
				LIMIT $1::int OFFSET $2::int
			`, pageSize, offset, id, showLocked);
		}
	}
	else
	{
		resultsQuery = db.query(`
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
				count(*) over() AS count
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
						WHERE user_node_permissions.type != 'board' AND user_node_permissions.type_id = $7 AND user_node_permissions.node_permission_id = $5 AND user_node_permissions.parent_node_id = $1::int AND
							($4 = true OR ($4 = false AND user_node_permissions.locked IS NULL))

						UNION ALL

						SELECT
							'group' AS type,
							user_group_node_permissions.id AS inner_node_id,
							user_group_node_permissions.type_id,
							user_group_node_permissions.node_id,
							user_group_node_permissions.granted,
							user_group_node_permissions.sequence
						FROM user_group_node_permissions
						WHERE user_group_node_permissions.type != 'board' AND user_group_node_permissions.user_group_id = ANY($6) AND user_group_node_permissions.node_permission_id = $5 AND user_group_node_permissions.parent_node_id = $1::int AND
							($4 = true OR ($4 = false AND user_group_node_permissions.locked IS NULL))
					) AS permissions
					ORDER BY inner_node_id ASC, sequence ASC, type DESC, type_id DESC
				) AS permissions
			) AS permissions ON (permissions.inner_node_id = node.id AND (permissions.granted = true OR $8 = true))
			ORDER BY thread_type desc, ${order} ${reverse ? 'DESC' : ''}
			LIMIT $2::int OFFSET $3::int
		`, id, pageSize, offset, showLocked, constants.nodePermissions.read, groupIds, this.userId, node.parent_node_id === constants.boardIds.privateThreads && viewPTs);
	}

	// Actually run the queries (don't paginate boards)
	const [results, viewFollowersPerm] = await Promise.all([
		resultsQuery,
		this.query('v1/permission', {permission: 'view-followers'}),
	]);

	// A combination of what node/full does but faster
	// combined with getting all the node info above in bulk
	// replyCount / latestPage / latestPost / lastChecked: See v1/node/full.js
	const nodes = await Promise.all(
		results.map(async node => {
			return Promise.all([
				node,
				node.type === 'thread' ? db.query(`
					SELECT title
					FROM node_revision
					WHERE node_id = $1::int
					ORDER BY time DESC
					LIMIT 1
				`, node.parent_node_id) : null,
				node.user_id ? (node.type === 'thread' ?
					this.query('v1/user_lite', {id: node.user_id}) :
					this.query('v1/user', {id: node.user_id})) : null,
				node.parent_node_id === constants.boardIds.privateThreads ? db.query(`
					SELECT
						user_account_cache.id,
						user_account_cache.username,
						user_node_permission.granted
					FROM user_account_cache
					JOIN user_node_permission ON (user_node_permission.user_id = user_account_cache.id)
					JOIN node_permission ON (node_permission.id = user_node_permission.node_permission_id)
					WHERE user_node_permission.node_id = $1::int AND node_permission.identifier = 'read'
					ORDER BY username ASC
				`, node.id) : null,
				['board', 'thread'].includes(node.type) ? db.query(`
					SELECT node_id
					FROM followed_node
					WHERE node_id = $1::int AND user_id = $2::int
				`, node.id, this.userId) : null,
				viewFollowersPerm && node.type === 'thread' ? db.query(`
					SELECT count(*) AS count
					FROM followed_node
					WHERE node_id = $1::int
				`, node.id) : null,
				node.type === 'post' ? db.query(`
					SELECT count(*) AS count
					FROM node_revision
					WHERE node_id = $1::int
				`, node.id) : null,
				node.type === 'post' ? this.query('v1/node/permission', {permission: 'edit', nodeId: node.id}) : null,
				node.type === 'thread' && this.userId ? db.query(`
					SELECT
						CEIL((
							SELECT count(*)+(
								SELECT count(*)
								FROM node
								WHERE node.parent_node_id = $1 AND node.creation_time > last_checked
								LIMIT 1
							) AS count
							FROM node
							WHERE node.parent_node_id = $1 AND node.creation_time < last_checked
						) / $3::float) AS latest_page
					FROM (
						SELECT last_checked
						FROM node_user
						WHERE node_id = $1 AND user_id = $2
					) AS last_checked
				`, node.id, this.userId, constants.threadPageSize) : null,
				node.type === 'thread' && this.userId ? db.query(`
					SELECT
						(
							SELECT node.id
							FROM node
							WHERE node.parent_node_id = $1 AND node.creation_time > last_checked
							ORDER BY node.creation_time ASC
							LIMIT 1
						) AS latest_post
					FROM (
						SELECT last_checked
						FROM node_user
						WHERE node_id = $1 AND user_id = $2
					) AS last_checked
				`, node.id, this.userId) : null,
				node.type === 'thread' ? db.query(`
					SELECT count(*)-1 AS count
					FROM node
					WHERE node.parent_node_id = $1
				`, node.id) : null,
				node.type === 'thread' ? db.query(`
					SELECT last_checked
					FROM node_user
					WHERE node_id = $1 AND user_id = $2
				`, node.id, this.userId) : [],
				node.type === 'thread' ? this.query('v1/node/permission', {permission: 'lock', nodeId: node.id}) : null,
				node.type === 'thread' && this.userId ? db.query(`
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
				`, node.id, this.userId) : null,
				node.type === 'post' ? db.query(`
					SELECT file.id, file.file_id, file.name, file.width, file.height, file.caption
					FROM node_revision_file
					JOIN file ON (node_revision_file.file_id = file.id)
					WHERE node_revision_file.node_revision_id = $1::int
					ORDER BY file.sequence ASC
				`, node.revision_id) : null,
			]);
		})
	);

	// we should essentially be returning the same thing as node/full here
	// exception is node permissions, which we don't need to get for each child (only posts)
	const childNodes = nodes.map(result => {
		const node = result[0];
		const parent = result[1];
		const user = result[2];
		const users = result[3];

		let followedNode, numFollowed;

		if (['board', 'thread'].includes(node.type))
		{
			[followedNode] = result[4];

			if (viewFollowersPerm && node.type === 'thread')
			{
				[numFollowed] = result[5];
			}
		}

		const revisions = result[6];
		const editPerm = result[7]; // just edit atm
		const latestPage = result[8] && result[8][0] ? result[8][0].latest_page : null;
		const latestPost = result[9] && result[9][0] ? result[9][0].latest_post : null;
		const replyCount = result[10];
		const lastChecked = result[11];
		const lockPerm = result[12];

		let permissions = [];

		if (editPerm)
		{
			permissions.push('edit');
		}

		if (lockPerm)
		{
			permissions.push('lock');
		}

		const unreadTotal = result[13];
		const nodeFiles = result[14];

		const replies = replyCount ? Number(replyCount[0].count) : 0;

		return {
			id: node.id,
			type: node.type,
			parentId: node.parent_node_id,
			revisionId: node.revision_id,
			title: node.title,
			created: node.creation_time,
			locked: node.locked,
			threadType: node.thread_type,
			edits: revisions ? revisions[0].count - 1 : 0,
			followed: followedNode ? true : false,
			numFollowed: viewFollowersPerm && numFollowed ? Number(numFollowed.count) : 0,
			board: parent ? parent[0].title : '',
			user: user,
			content: node.content ? {
				text: node.content,
				format: node.content_format,
			} : null,
			lastReply: node.latest_reply_time ? dateUtils.formatDateTime(node.latest_reply_time) : null,
			users: users,
			permissions: permissions,
			latestPage: latestPage,
			latestPost: latestPost,
			replyCount: replies,
			unread: this.userId && node.type === 'thread' ? (lastChecked.length > 0 ? (latestPost > 0 ? true : false) : (node.locked ? false : true)) : false,
			unreadTotal: unreadTotal ? (unreadTotal[0] ? Number(unreadTotal[0].count) : replies+1) : null,
			files: nodeFiles ? nodeFiles.map(file => {
				return {
					id: file.id,
					fileId: file.file_id,
					name: file.name,
					width: file.width,
					height: file.height,
					caption: file.caption,
				}
			}) : [],
			showImages: userSettings && userSettings[0] ? userSettings[0].show_images : false,
			conciseMode: userSettings && userSettings[0] ? userSettings[0].concise_mode : 2,
		};
	});

	return {
		childNodes: childNodes,
		count: results.length > 0 ? Number(results[0].count) : 0,
		page: page,
		pageSize: pageSize,
		order: order,
		reverse: reverse,
		showLocked: showLocked,
	};
}

children.apiTypes = {
	id: {
		type: APITypes.nodeId,
	},
	order: {
		type: APITypes.string,
		default: 'creation_time',
		includes: constants.orderOptions.node.map(x => x.id),
	},
	reverse: {
		type: APITypes.boolean,
		default: 'false',
	},
	page: {
		type: APITypes.number,
		required: true,
		min: 1,
	},
	showLocked: {
		type: APITypes.boolean,
		default: 'false',
	},
}

export default children;