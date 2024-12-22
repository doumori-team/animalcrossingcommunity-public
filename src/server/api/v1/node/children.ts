import * as db from '@db';
import { UserError } from '@errors';
import { constants, dateUtils } from '@utils';
import * as APITypes from '@apiTypes';
import * as accounts from '@accounts';
import { APIThisType, NodeChildNodesType } from '@types';

async function children(this: APIThisType, { id, order, reverse, page, showLocked }: childrenProps): Promise<NodeChildrenType>
{
	if (showLocked && !this.userId)
	{
		throw new UserError('login-needed');
	}

	const [permission, [node], groupIds, ggBoardPerm, publicBoards, archivedBoards] = await Promise.all([
		this.query('v1/node/permission', { permission: 'read', nodeId: id }),
		db.query(`
			SELECT type
			FROM node
			WHERE id = $1::int
		`, id),
		db.getUserGroups(this.userId),
		this.userId && id === constants.boardIds.accForums ? this.query('v1/node/permission', {
			permission: 'read',
			nodeId: constants.boardIds.ggBoard,
		}) : null,
		id === constants.boardIds.publicThreads ? db.query(`
			SELECT id
			FROM node
			WHERE type = 'board' AND board_type = 'public'
		`) : null,
		db.query(`
			SELECT id
			FROM node
			WHERE type = 'board' AND board_type = 'archived'
		`),
	]);

	if (!permission)
	{
		throw new UserError('permission');
	}

	if (!this.userId && page > 1)
	{
		throw new UserError('login-needed');
	}

	if (node.type === 'thread')
	{
		order = 'creation_time';
		reverse = false;
	}

	// logic that auto grants access to user to age-locked GG Boards
	if (this.userId && id === constants.boardIds.accForums && !ggBoardPerm)
	{
		const modifyBoardAgePerm: boolean = await this.query('v1/permission', { permission: 'allow-age-board' });

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
	const offset = page * pageSize - pageSize;

	let resultsQuery = null;

	// should be using scout_hub/threads or shop/threads
	if ([constants.boardIds.shopThread, constants.boardIds.adopteeThread].includes(id))
	{
		throw new UserError('bad-format');
	}
	// if on the PTs BOARD
	// then can look VIEW stuff you have user access to
	else if (constants.boardIds.privateThreads === id)
	{
		resultsQuery = db.query(`
			SELECT
				nodes.*,
				last_revision.id AS revision_id,
				last_revision.title,
				last_revision.content,
				last_revision.content_format
			FROM (
				SELECT
					pts_user_read_granted.node_id AS id,
					'thread' AS type,
					pts_user_read_granted.node_user_id AS user_id,
					$5 AS parent_node_id,
					pts_user_read_granted.creation_time,
					pts_user_read_granted.locked,
					pts_user_read_granted.thread_type,
					pts_user_read_granted.latest_reply_time,
					pts_user_read_granted.reply_count,
					count(*) over() AS count
				FROM pts_user_read_granted
				WHERE pts_user_read_granted.permission_user_id = $4 AND
					($3 = true OR ($3 = false AND pts_user_read_granted.locked IS NULL))
				ORDER BY thread_type DESC, ${order} ${reverse ? 'DESC' : ''}
				LIMIT $1 OFFSET $2
			) AS nodes
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = nodes.id
				ORDER BY time DESC
				FETCH FIRST 1 ROW ONLY
			) last_revision ON true
		`, pageSize, offset, showLocked, this.userId, constants.boardIds.privateThreads);
	}
	// if viewing the special All Public Threads board, then grab all threads from public boards
	// + GG boards that you have access to active in the last 30 days
	else if (id === constants.boardIds.publicThreads)
	{
		resultsQuery = db.query(`
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
								user_node_permissions.id AS inner_node_id,
								user_node_permissions.type_id,
								user_node_permissions.node_id,
								user_node_permissions.granted,
								user_node_permissions.sequence
							FROM user_node_permissions
							WHERE user_node_permissions.type = 'thread' AND user_node_permissions.type_id = $6 AND user_node_permissions.node_permission_id = $4 AND user_node_permissions.parent_node_id = ANY($1) AND user_node_permissions.locked IS NULL AND user_node_permissions.latest_reply_time > now() - interval '30' day

							UNION ALL

							SELECT
								'group' AS type,
								user_group_node_permissions.id AS inner_node_id,
								user_group_node_permissions.type_id,
								user_group_node_permissions.node_id,
								user_group_node_permissions.granted,
								user_group_node_permissions.sequence
							FROM user_group_node_permissions
							WHERE user_group_node_permissions.type = 'thread' AND user_group_node_permissions.user_group_id = ANY($5) AND user_group_node_permissions.node_permission_id = $4 AND user_group_node_permissions.parent_node_id = ANY($1) AND user_group_node_permissions.locked IS NULL AND user_group_node_permissions.latest_reply_time > now() - interval '30' day
						) AS permissions
						ORDER BY inner_node_id ASC, sequence ASC, type DESC, type_id DESC
					) AS permissions
				) AS permissions ON (permissions.inner_node_id = node.id AND permissions.granted = true)
				ORDER BY latest_reply_time DESC
				LIMIT $2::int OFFSET $3::int
			) AS nodes
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = nodes.id
				ORDER BY time DESC
				FETCH FIRST 1 ROW ONLY
			) last_revision ON true
		`, publicBoards.map((x: { id: string }) => Number(x.id)).concat([constants.boardIds.ggBoard, constants.boardIds.ggOffTopic, constants.boardIds.ggWiFiLobby, constants.boardIds.colorDuels, constants.boardIds.schrodingersChat]), pageSize, offset, constants.nodePermissions.read, groupIds, this.userId);
	}
	else if (archivedBoards.map((x: { id: string }) => Number(x.id)).includes(id))
	{
		resultsQuery = db.query(`
			SELECT
				archived_threads.id,
				archived_threads.type,
				archived_threads.user_id,
				archived_threads.parent_node_id,
				archived_threads.creation_time,
				archived_threads.revision_id,
				archived_threads.title,
				archived_threads.content,
				archived_threads.content_format,
				archived_threads.locked,
				archived_threads.thread_type,
				archived_threads.latest_reply_time,
				archived_threads.reply_count,
				count(*) over() AS count
			FROM archived_threads
			WHERE archived_threads.parent_node_id = $3 AND
				($4 = true OR ($4 = false AND archived_threads.locked IS NULL))
			ORDER BY thread_type DESC, ${order} ${reverse ? 'DESC' : ''}
			LIMIT $1::int OFFSET $2::int
		`, pageSize, offset, id, showLocked);
	}
	// looking at a PT, Shop Thread, or Scout Thread
	// looking at a public board's children, or public thread's children
	// or GG Board children, or GG Thread's children
	// OR Staff Board children or Staff Thread children
	// We already checked that the parent - board or thread - you have view access
	// Since we don't (shouldn't) do node permissions by thread or post
	// and we don't grab boards here, we do that in node/boards
	// Then we don't have to do a super search with permissions
	else
	{
		resultsQuery = db.query(`
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
				WHERE node.parent_node_id = $3 AND node.type != 'board' AND
					($4 = true OR ($4 = false AND node.locked IS NULL))
				ORDER BY thread_type DESC, ${order} ${reverse ? 'DESC' : ''}
				LIMIT $1::int OFFSET $2::int
			) AS nodes
			LEFT JOIN LATERAL (
				SELECT id, title, content, content_format
				FROM node_revision
				WHERE node_revision.node_id = nodes.id
				ORDER BY time DESC
				FETCH FIRST 1 ROW ONLY
			) last_revision ON true
		`, pageSize, offset, id, showLocked);
	}

	const [count, childNodes] = await db.getChildren(resultsQuery, this.query, this.userId, true);

	return <NodeChildrenType>{
		childNodes: childNodes,
		count: count,
		page: page,
		pageSize: pageSize,
		order: order,
		reverse: reverse,
		showLocked: showLocked,
	};
}

const orderOptions = constants.orderOptions.node.map(x => x.id);

children.apiTypes = {
	id: {
		type: APITypes.nodeId,
		required: true,
	},
	order: {
		type: APITypes.string,
		default: 'creation_time',
		includes: orderOptions,
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
};

type childrenProps = {
	id: number
	order: typeof orderOptions[number]
	reverse: boolean
	page: number
	showLocked: boolean
};

type NodeChildrenType = {
	childNodes: NodeChildNodesType[]
	count: number
	page: number
	pageSize: number
	order: typeof orderOptions[number]
	reverse: boolean,
	showLocked: boolean,
};

export default children;
